// middleware/apiKeyMiddleware.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apiKeys.json'); // Adjust the path if necessary

// Check if the file exists; if not, create an empty file
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}'); // Create an empty JSON object if file doesn't exist
}

const validApiKeys = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

exports.validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || !validApiKeys[apiKey]) {
        return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    next(); // Proceed to the next middleware/route handler
};
