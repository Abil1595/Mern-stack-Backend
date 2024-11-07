// controllers/apiKeyController.js
const { generateApiKey } = require('../utils/apiKeyUtils');

exports.createApiKey = async (req, res) => {
    try {
        const apiKey = await generateApiKey();
        // Respond with the generated API key
        return res.status(201).json({
            success: true,
            apiKey: apiKey, // Send back the generated API key
        });
    } catch (error) {
        // Respond with an error if generation fails
        console.error('Error creating API key:', error); // Log the error
        return res.status(500).json({ success: false, message: 'Failed to generate API key' });
    }
};
