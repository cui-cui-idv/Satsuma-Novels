const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// アカウント設定ページを表示
router.get('/account/settings', isAuthenticated, accountController.showSettingsPage);

// Firestoreのメールアドレスを更新するためのAPI
// (Firebase Authの更新はクライアントで行い、その結果をサーバーに通知してDBを更新する)
router.post('/account/update-email', isAuthenticated, accountController.updateFirestoreEmail);

module.exports = router;