const logger = require("../../utils/log");

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
    return async function ({ event, ...rest2 }) {
        try {
            const { handleReaction, commands } = global.client;
            const { messageID, threadID } = event;
            
            if (!handleReaction || handleReaction.length === 0) return;
            
            const indexOfHandle = handleReaction.findIndex(e => e.messageID === messageID);
            if (indexOfHandle < 0) return;
            
            const indexOfMessage = handleReaction[indexOfHandle];
            const handleNeedExec = commands.get(indexOfMessage.name);

            if (!handleNeedExec) {
                logger.error(`Command not found for reaction handler: ${indexOfMessage.name}`);
                return await api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, null, false);
            }
            
            if (typeof handleNeedExec.handleReaction !== 'function') {
                logger.error(`Command ${indexOfMessage.name} does not have handleReaction method`);
                return await api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, null, false);
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
                handleReaction: indexOfMessage,
                getText: getText2
            };
            
            // Execute the command's handleReaction method
            await handleNeedExec.handleReaction(Obj);
            
        } catch (error) {
            logger.error('Error in handleReaction:', error);
            try {
                const errorMessage = global.getText('handleReaction', 'executeError', error.message || error);
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
};
