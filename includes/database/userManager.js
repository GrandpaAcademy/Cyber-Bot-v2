const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/log');

class UserDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'usersData.json');
    this.data = this.loadDatabase();
  }

  loadDatabase() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        fs.writeJSONSync(this.dbPath, { users: {} });
      }
      return fs.readJSONSync(this.dbPath);
    } catch (error) {
      logger.error('Failed to load user database:', error);
      return { users: {} };
    }
  }

  saveDatabase() {
    try {
      fs.writeJSONSync(this.dbPath, this.data, { spaces: 2 });
      return true;
    } catch (error) {
      logger.error('Failed to save user database:', error);
      return false;
    }
  }

  hasUser(userID) {
    return !!this.data.users[userID];
  }

  getUser(userID) {
    return this.data.users[userID] || null;
  }

  async addUser(userID, userData = {}) {
    try {
      if (!this.hasUser(userID)) {
        this.data.users[userID] = {
          userID: userID,
          name: userData.name || 'Facebook User',
          firstName: userData.firstName || '',
          vanity: userData.vanity || '',
          gender: userData.gender || 0,
          profileUrl: userData.profileUrl || '',
          isFriend: userData.isFriend || false,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          ...userData
        };
        
        await this.saveDatabase();
        logger.info(`[ DATABASE ] Added new user ${userID}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to add user ${userID}:`, error);
      return false;
    }
  }

  async updateUser(userID, userData) {
    try {
      if (this.hasUser(userID)) {
        this.data.users[userID] = {
          ...this.data.users[userID],
          ...userData,
          updatedTime: Date.now()
        };
        await this.saveDatabase();
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to update user ${userID}:`, error);
      return false;
    }
  }

  async ensureUser(userID, api) {
    try {
      if (!this.hasUser(userID)) {
        // Try to get user info from Facebook
        let userData = {};
        try {
          userData = await api.getUserInfo(userID);
          userData = userData[userID];
        } catch (e) {
          logger.warn(`Could not fetch info for user ${userID} from Facebook`);
        }
        
        await this.addUser(userID, userData);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to ensure user ${userID}:`, error);
      return false;
    }
  }
}

module.exports = new UserDatabase();
