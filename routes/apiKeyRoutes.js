// routes/apiKeyRoutes.js
const express = require('express');
const { createApiKey } = require('../controllers/apiKeyController');
const router = express.Router();

router.route('/generate-api-key').post(createApiKey);

module.exports = router;
