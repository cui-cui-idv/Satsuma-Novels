const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// ▼▼▼ この行で、必要なミドルウェアを全て読み込みます ▼▼▼
const { isAuthenticated, verifyRecaptcha } = require('../middleware/authMiddleware');

// 登録ページ表示
router.get('/register', authController.showRegisterPage);
// クライアントでの登録後、Firestoreにデータを作成するためのAPI
router.post('/register-firestore', verifyRecaptcha, authController.finalizeRegistration);

// ログインページ表示
router.get('/login', authController.showLoginPage);
// ログイン処理 (IDトークンを受け取る)
router.post('/login', verifyRecaptcha, authController.loginUser);

// ハンドル名またはメールアドレスから、メールアドレスを取得するAPI
router.post('/api/get-email-from-identifier', authController.getEmailFromIdentifier);

// ログアウト処理
router.post('/logout', authController.logoutUser);

// パスワードリセット要求ページ
router.get('/forgot-password', authController.showForgotPasswordPage);

// パスワードリセット実行ページ
router.get('/reset-password-action', authController.showResetPasswordPage);

// メール認証のアクションページ
router.get('/verify-email-action', authController.showVerifyEmailPage);

// メール認証を促すページを表示
router.get('/please-verify', isAuthenticated, authController.showPleaseVerifyPage);

module.exports = router;