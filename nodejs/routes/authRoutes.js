const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.get('/logoutadmin', authController.logoutadmin);
router.post('/loginadmin', authController.loginadmin);
router.post('/registeradmin', authController.registeradmin);

module.exports = router;