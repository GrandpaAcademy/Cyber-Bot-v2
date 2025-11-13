/**
 * @author D-Jukie
 * @warn Do not edit code or edit credits
 * @src Disme Project
 * @bug fixed by @YanMaglinte
 */
module.exports = function ({ api, Threads }) {
    const logger = require("../../utils/log.js");
    
    return async function ({ event }) {
        try {
            const { threadID, logMessageType, logMessageData } = event;
            const { setData, getData, delData } = Threads;
            
            if (!threadID || !logMessageType) {
                logger.warn('Missing required event data in handleRefresh', 'WARNING');
                return;
            }
            
            let dataThread;
            try {
                const threadData = await getData(threadID);
                dataThread = threadData?.threadInfo;
                
                if (!dataThread) {
                    logger.warn(`Thread data not found for ${threadID}`, 'WARNING');
                    return;
                }
            } catch (error) {
                logger.error(`Failed to get thread data for ${threadID}:`, error.message);
                return;
            }
            
            switch (logMessageType) {
                case "log:thread-admins": {
                    try {
                        if (logMessageData.ADMIN_EVENT === "add_admin") {
                            // Check if admin already exists
                            if (!dataThread.adminIDs.some(admin => admin.id === logMessageData.TARGET_ID)) {
                                dataThread.adminIDs.push({
                                    id: logMessageData.TARGET_ID
                                });
                                logger.log(`Added admin ${logMessageData.TARGET_ID} to group ${threadID}`, 'UPDATE DATA');
                            }
                        } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                            dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id !== logMessageData.TARGET_ID);
                            logger.log(`Removed admin ${logMessageData.TARGET_ID} from group ${threadID}`, 'UPDATE DATA');
                        }
                        await setData(threadID, { threadInfo: dataThread });
                    } catch (adminError) {
                        logger.error(`Error updating admin data for ${threadID}:`, adminError.message);
                    }
                    break;
                }
                
                case "log:thread-name": {
                    try {
                        const newName = event.logMessageData?.name || 'Unknown Group';
                        logger.log(`Updated name for group ${threadID}: ${newName}`, 'UPDATE DATA');
                        dataThread.threadName = newName;
                        await setData(threadID, { threadInfo: dataThread });
                    } catch (nameError) {
                        logger.error(`Error updating thread name for ${threadID}:`, nameError.message);
                    }
                    break;
                }
                
                case "log:subscribe": {
                    try {
                        const botId = api.getCurrentUserID();
                        const addedParticipants = event.logMessageData?.addedParticipants || [];
                        
                        // Skip if bot was added
                        if (addedParticipants.some(participant => participant.userFbId === botId)) {
                            logger.log(`Bot was added to group ${threadID}, skipping`, 'INFO');
                            return;
                        }
                        
                        // Add new participants
                        let newParticipantsAdded = 0;
                        for (const participant of addedParticipants) {
                            if (!dataThread.participantIDs.includes(participant.userFbId)) {
                                dataThread.participantIDs.push(participant.userFbId);
                                newParticipantsAdded++;
                            }
                        }
                        
                        if (newParticipantsAdded > 0) {
                            await Threads.setData(event.threadID, { threadInfo: dataThread });
                            logger.log(`Added ${newParticipantsAdded} new participants to group ${threadID}`, 'ADD DATA');
                        }
                    } catch (subscribeError) {
                        logger.error(`Error handling subscription event for ${threadID}:`, subscribeError.message);
                    }
                    break;
                }
                
                case 'log:unsubscribe': {
                    try {
                        const leftParticipantId = logMessageData.leftParticipantFbId;
                        const botId = api.getCurrentUserID();
                        
                        if (leftParticipantId === botId) {
                            // Bot was removed from the group
                            logger.log(`Bot was removed from group ${threadID}, deleting group data`, 'DELETE DATA');
                            try {
                                const index = global.data.allThreadID.findIndex(item => item === threadID);
                                if (index !== -1) {
                                    global.data.allThreadID.splice(index, 1);
                                }
                                await delData(threadID);
                                logger.log(`Successfully deleted data for removed group ${threadID}`, 'DELETE DATA');
                            } catch (deleteError) {
                                logger.error(`Failed to delete group data for ${threadID}:`, deleteError.message);
                            }
                            return;
                        } else {
                            // User left the group
                            const participantIndex = dataThread.participantIDs.findIndex(item => item === leftParticipantId);
                            if (participantIndex !== -1) {
                                dataThread.participantIDs.splice(participantIndex, 1);
                                
                                // Remove from admin list if they were an admin
                                const adminIndex = dataThread.adminIDs.findIndex(admin => admin.id === leftParticipantId);
                                if (adminIndex !== -1) {
                                    dataThread.adminIDs.splice(adminIndex, 1);
                                    logger.log(`Removed user ${leftParticipantId} from admin list in group ${threadID}`, 'UPDATE DATA');
                                }
                                
                                logger.log(`Removed user ${leftParticipantId} from group ${threadID}`, 'DELETE DATA');
                                await setData(threadID, { threadInfo: dataThread });
                            }
                        }
                    } catch (unsubscribeError) {
                        logger.error(`Error handling unsubscribe event for ${threadID}:`, unsubscribeError.message);
                    }
                    break;
                }
                
                default:
                    logger.debug(`Unhandled log message type: ${logMessageType}`, 'DEBUG');
                    break;
            }
            
        } catch (error) {
            logger.error(`Critical error in handleRefresh for event:`, error.message);
            logger.error('Full error details:', error.stack);
        }
    };
}