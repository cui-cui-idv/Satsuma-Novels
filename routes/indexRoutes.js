const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const indexController = require('../controllers/indexController');

// ホームページ
router.get('/', indexController.showTopPage);

// 自分のプロフィールページ (マイページ)
router.get('/profile', isAuthenticated, profileController.showProfilePage);

// プライバシーポリシーページ
router.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy', { title: 'プライバシーポリシー' });
});

router.get('/disclaimer', (req, res) => {
    res.render('disclaimer', { title: '免責事項' });
});


module.exports = router;