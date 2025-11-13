const logger = require("../../utils/log");

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
    return async function ({ event, ...rest2 }) {
        try {
            if (!event.messageReply) return;
            
            const { handleReply, commands } = global.client;
            const { messageID, threadID, messageReply } = event;
            
            if (!handleReply || handleReply.length === 0) return;
            
            const indexOfHandle = handleReply.findIndex(e => e.messageID === messageReply.messageID);
            if (indexOfHandle < 0) return;
            
            const indexOfMessage = handleReply[indexOfHandle];
            const handleNeedExec = commands.get(indexOfMessage.name);
            
            if (!handleNeedExec) {
                logger.error(`Command not found for reply handler: ${indexOfMessage.name}`);
                return await api.sendMessage(global.getText('handleReply', 'missingValue'), threadID, null, false);
            }
            
            if (typeof handleNeedExec.handleReply !== 'function') {
                logger.error(`Command ${indexOfMessage.name} does not have handleReply method`);
                return await api.sendMessage(global.getText('handleReply', 'missingValue'), threadID, null, false);
            }
            
            // Improved getText function with error handling
            const getText2 = (...values) => {
                try {
                    if (!handleNeedExec.languages || typeof handleNeedExec.languages !== 'object') {
                        return '';
                    }
                    
                    const langModule = handleNeedExec.languages;
                    if (!langModule.hasOwnProperty(global.config.language)) {
                        logger.warn(`Language ${global.config.language} not found for command ${handleNeedExec.config.name}`);
                        api.sendMessage(
                            global.getText('handleCommand', 'notFoundLanguage', handleNeedExec.config.name),
                            threadID,
                            null,
                            false
                        ).catch(err => logger.error('Error sending language not found message:', err));
                    }
                    
                    const lang = langModule[global.config.language][values[0]] || '';
                    let processedLang = lang;
                    
                    for (let i = values.length; i > 1; i--) {
                        const expReg = new RegExp('%' + i, 'g');
                        processedLang = processedLang.replace(expReg, values[i]);
                    }
                    
                    return processedLang;
                } catch (error) {
                    logger.error('Error in getText function:', error.message);
                    return '';
                }
            };
            
            const Obj = {
                ...rest,
                ...rest2,
                api,
                event,
                models,
                Users,
                Threads,
                Currencies,
                handleReply: indexOfMessage,
                getText: getText2
            };
            
            // Execute the command's handleReply method
            await handleNeedExec.handleReply(Obj);
            
        } catch (error) {
            logger.error('Error in handleReply:', error);
            try {
                const errorMessage = global.getText('handleReply', 'executeError', error.message || error);
                try {
                    await api.sendMessage(errorMessage, event.threadID, null, false);
                } catch (sendError) {
                    logger.error('Failed to send error message:', sendError);
                }
            } catch (sendError) {
                logger.error('Failed to send error message:', sendError);
            }
        }
    };
}
