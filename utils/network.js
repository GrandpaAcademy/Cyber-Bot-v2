const axios = require('axios');

async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
}

module.exports = {
  async get(url, options = {}) {
    return retryRequest(() => axios.get(url, options));
  },
  
  async post(url, data, options = {}) {
    return retryRequest(() => axios.post(url, data, options));
  },
  
  async request(config) {
    return retryRequest(() => axios(config));
  }
};
