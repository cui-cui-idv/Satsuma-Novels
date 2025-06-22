// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 登録ページ表示
router.get('/register', authController.showRegisterPage);
// 登録処理
router.post('/register', authController.registerUser);

// ログインページ表示
router.get('/login', authController.showLoginPage);
// ログイン処理 (IDトークンを受け取る)
router.post('/login', authController.loginUser);

// ログアウト処理
router.post('/logout', authController.logoutUser);

// パスワードリセット要求ページを表示
router.get('/forgot-password', authController.showForgotPasswordPage);
// パスワードリセット実行ページを表示
router.get('/reset-password-action', authController.showResetPasswordPage);

router.post('/register-firestore', authController.finalizeRegistration);

// メール認証のアクションページ
router.get('/verify-email-action', authController.showVerifyEmailPage);

module.exports = router;