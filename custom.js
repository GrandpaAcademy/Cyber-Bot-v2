const logger = require('./utils/log');
const cron = require('node-cron');

module.exports = async ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 60, // Restart every 60 minutes
      timezone: 'Asia/Dhaka',
      note: 'Periodic bot restart to maintain stability'
    },
    acceptPending: {
      status: true,
      time: 30, // Check pending requests every 30 minutes
      timezone: 'Asia/Dhaka',
      note: 'Auto-approve pending message requests'
    }
  };

  function autoRestart(config) {
    if (config.status) {
      logger.custom('Auto restart is enabled. Will restart every ' + config.time + ' minutes.', 'CONFIG');
      cron.schedule(`*/${config.time} * * * *`, () => {
        logger.custom('Initiating system reboot...', 'AUTO RESTART');
        process.exit(1);
      }, {
        scheduled: true,
        timezone: config.timezone
      });
    }
  }

  async function acceptPending(config) {
    if (config.status) {
      logger.custom('Auto accept pending is enabled. Will check every ' + config.time + ' minutes.', 'CONFIG');
      cron.schedule(`*/${config.time} * * * *`, async () => {
        try {
          // Get pending threads
          const pending = [
            ...(await api.getThreadList(10, null, ['PENDING'])),
            ...(await api.getThreadList(10, null, ['OTHER']))
          ];

          // Process each pending thread
          for (const thread of pending) {
            try {
              await api.sendMessage(
                'Your message request has been approved automatically.',
                thread.threadID
              );
              logger.custom(`Approved message request from: ${thread.threadID}`, 'AUTO ACCEPT');
            } catch (err) {
              logger.error(`Failed to approve thread ${thread.threadID}: ${err.message}`);
            }
          }
        } catch (error) {
          logger.error('Error in acceptPending:', error);
        }
      }, {
        scheduled: true,
        timezone: config.timezone
      });
    }
  }

  // Initialize features
  autoRestart(config.autoRestart);
  acceptPending(config.acceptPending);

  // Error handler for unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Error handler for uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
  });
};
