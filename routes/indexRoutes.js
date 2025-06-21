// routes/indexRoutes.js (修正後の完成形)

const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const indexController = require('../controllers/indexController'); // ★ 1. トップページ用のコントローラーを読み込む

// ホームページ
router.get('/', indexController.showTopPage); // ★ 2. ルートの処理を、データ取得を行うコントローラーの関数に変更

// プロフィールページ (ログインユーザーのみ)
router.get('/profile', isAuthenticated, profileController.showProfilePage);

// 管理者ページ (管理者・副管理者のみ)
// '/admin'に直接アクセスされた場合、ユーザー管理ページにリダイレクトする方が親切です。
router.get('/admin', isAuthenticated, hasRole(['admin', 'sub-admin']), (req, res) => {
    res.redirect('/admin/users'); // ★ 3. (改善) 汎用ページではなく、具体的な管理ページに移動させる
});

module.exports = router;