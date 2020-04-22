const express = require('express');
const router = express.Router();
const ApiService = require('../services/ApiService');

router.get('/apikey',ApiService.apikey);
router.post('/apikeycheck',ApiService.apikeycheck);


module.exports = router;

