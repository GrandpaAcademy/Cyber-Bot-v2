const logger = require("../../utils/log");

module.exports = function ({ Users, Threads }) {
    return async function ({ event }) {
        try {
            const { allUserID, allThreadID } = global.data;
            const { autoCreateDB } = global.config;
            
            // Skip if auto-create is disabled
            if (autoCreateDB === false) return;
            
            var { senderID, threadID } = event;
            senderID = String(senderID);
            var threadID = String(threadID);
            
            // Input validation
            if (!senderID || !threadID) {
                logger.warn('Missing senderID or threadID in handleCreateDatabase', 'WARNING');
                return;
            }
            
            // Load database files with error handling
            let threads, users;
            try {
                threads = require('../database/data/threadsData.json');
                users = require('../database/data/usersData.json');
            } catch (fileError) {
                logger.error('Error loading database files:', fileError.message);
                return;
            }
            
            // Handle group threads
            if (event.isGroup === true) {
                // Create new thread data if it doesn't exist
                if (!allThreadID.includes(threadID) && !threads.hasOwnProperty(threadID)) {
                    try {
                        allThreadID.push(threadID);
                        await Threads.createData(threadID);
                        logger.log(global.getText('handleCreateDatabase', 'newThread', threadID), 'DATABASE');
                    } catch (createError) {
                        logger.error(`Failed to create thread data for ${threadID}:`, createError.message);
                    }
                }
                
                // Update participant list for existing threads
                if (threads.hasOwnProperty(threadID)) {
                    try {
                        const data = threads[threadID];
                        if (data?.threadInfo?.participantIDs) {
                            if (!data.threadInfo.participantIDs.includes(senderID)) {
                                data.threadInfo.participantIDs.push(senderID);
                                logger.log(`Added participant ${senderID} to group ${threadID}`, 'ADD DATA');
                                await Threads.setData(threadID, { threadInfo: data.threadInfo });
                            }
                        }
                    } catch (participantError) {
                        logger.error(`Failed to update participant data for ${threadID}:`, participantError.message);
                    }
                }
            }
            
            // Handle user data
            if (!allUserID.includes(senderID) && !users.hasOwnProperty(senderID)) {
                try {
                    allUserID.push(senderID);
                    await Users.createData(senderID);
                    logger.log(global.getText('handleCreateDatabase', 'newUser', senderID), 'DATABASE');
                } catch (userCreateError) {
                    logger.error(`Failed to create user data for ${senderID}:`, userCreateError.message);
                }
            }
            
        } catch (error) {
            logger.error('Critical error in handleCreateDatabase:', error.message);
            logger.error('Full error details:', error.stack);
        }
    };
}
