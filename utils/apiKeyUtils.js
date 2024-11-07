const crypto = require('crypto');
const ApiKey = require('../models/apiKeyModel'); // Ensure the path is correct based on your project structure

const generateApiKey = async () => {
    try {
        // Generate a random API key
        const apiKey = crypto.randomBytes(32).toString('hex');

        // Create a new instance of the ApiKey model
        const newApiKey = new ApiKey({ key: apiKey });

        // Save the new API key to the database
        await newApiKey.save();

        // Log the generated API key (optional)
        console.log('API Key generated:', apiKey);

        // Return the generated API key
        return apiKey;
    } catch (error) {
        console.error('Error generating API key:', error);
        throw new Error('Could not generate API key'); // Re-throw the error for handling in the controller
    }
};

module.exports = {
    generateApiKey,
};
