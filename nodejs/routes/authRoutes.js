const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const VerifyToken = require('../auth/VerifyToken')


router.get('/logoutadmin', authController.logoutadmin);
router.post('/loginadmin', authController.loginadmin,VerifyToken);
router.post('/registeradmin', authController.registeradmin);

module.exports = router;