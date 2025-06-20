// routes/indexRoutes.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// ホームページ
router.get('/', (req, res) => {
    res.render('index', { title: '薩摩ノベルズ' });
});

// プロフィールページ (ログインユーザーのみ)
router.get('/profile', isAuthenticated, profileController.showProfilePage);

// 管理者ページ (管理者・副管理者のみ)
router.get('/admin', isAuthenticated, hasRole(['admin', 'sub-admin']), (req, res) => {
    res.render('admin', { title: '管理ページ' });
});

module.exports = router;