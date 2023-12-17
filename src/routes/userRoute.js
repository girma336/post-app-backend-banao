const express = require('express');
const authController = require('./../controllers/authController');
const router = express.Router();

// Authentication Route
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.post('/resetPassword/:token', authController.resetPassword);

module.exports = router;