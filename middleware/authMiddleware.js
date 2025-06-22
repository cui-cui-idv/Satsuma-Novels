const admin = require('firebase-admin');
const axios = require('axios'); // axiosを読み込む
const db = admin.firestore();

// ユーザーがログインしているかチェックするミドルウェア
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// ユーザーが指定された役割を持っているかチェックするミドルウェア
const hasRole = (roles) => {
    return async (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).send('認証されていません');
        }
        const userRole = req.session.user.role;
        if (roles.includes(userRole)) {
            return next();
        } else {
            res.status(403).send('このページへのアクセス権限がありません。');
        }
    };
};

// ユーザーのメールアドレスが認証済みかチェックするミドルウェア
const isVerified = (req, res, next) => {
    if (req.session.user && (req.session.user.email_verified || req.session.user.role === 'admin')) {
        return next();
    }
    res.status(403).send('この機能を利用するには、メールアドレスの認証を完了させてください。');
};

// reCAPTCHAトークンを検証するミドルウェア
const verifyRecaptcha = async (req, res, next) => {
    const token = req.body.recaptchaToken;
    if (!token) {
        return res.status(400).json({ message: 'reCAPTCHAトークンがありません。' });
    }
    
    try {
        const secretKey = process.env.RECAPTCHA_V3_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

        const response = await axios.post(verificationUrl);
        const { success, score } = response.data;

        // スコアが0.5以上なら人間と判断（この数値は調整可能）
        if (success && score >= 0.5) {
            next();
        } else {
            res.status(403).json({ message: 'reCAPTCHAの検証に失敗しました。ボットの可能性があります。' });
        }
    } catch (error) {
        console.error("reCAPTCHA検証エラー:", error);
        res.status(500).send('reCAPTCHA検証中にエラーが発生しました。');
    }
};


// 作成した全ての関数を外部から使えるようにエクスポートする
module.exports = {
  isAuthenticated,
  hasRole,
  isVerified,
  verifyRecaptcha // verifyRecaptchaの関数定義と、ここのエクスポートがセット
};