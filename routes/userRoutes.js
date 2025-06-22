const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ハンドル名でプロフィールページを表示
router.get('/users/@:handle', userController.showUserProfileByHandle);

module.exports = router;