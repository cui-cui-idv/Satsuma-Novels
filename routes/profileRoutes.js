const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// プロフィール編集ページを表示
router.get('/profile/edit', isAuthenticated, profileController.showEditPage);

// プロフィール情報を更新
router.post('/profile/edit', isAuthenticated, profileController.updateProfile);

module.exports = router;