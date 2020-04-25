const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessinauth = require('../common/authUtils');


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot', authController.forgot);
router.post('/resetpass', authController.resetpass);

module.exports = router;