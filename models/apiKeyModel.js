// models/apiKeyModel.js
const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true, // Ensure the API key is unique
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Automatically delete the API key after 30 days (optional)
    },
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
