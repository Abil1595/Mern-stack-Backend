const ApiKey = require('../models/apiKeyModel'); 
exports.isvalidateApiKeyFromQuery = async (req, res, next) => {
    const apiKey = req.query.apiKey; // Get the API key from the query parameter
  
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
  
    const validKey = await ApiKey.findOne({ key: apiKey });
    if (!validKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  
    next(); // Proceed to the next middleware or route handler
  };
  