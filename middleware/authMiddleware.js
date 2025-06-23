const admin = require('firebase-admin');
const axios = require('axios');
// dbは現在このファイルでは使われていないため、一旦コメントアウトまたは削除します。
// const db = admin.firestore();

/**
 * ユーザーがログインしているかチェックするミドルウェア
 */
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

/**
 * ユーザーが指定された役割を持っているかチェックするミドルウェア
 * @param {string[]} roles 許可する役割の配列 (例: ['admin', 'moderator'])
 */
const hasRole = (roles) => {
    return (req, res, next) => {
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

/**
 * ユーザーのメールアドレスが認証済みかチェックするミドルウェア
 */
// ▼▼▼ この行の "exports.isVerified =" を "const isVerified =" に修正 ▼▼▼
const isVerified = (req, res, next) => {
    // 管理者は認証チェックをスキップ
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    // email_verifiedがtrueならOK
    if (req.session.user && req.session.user.email_verified) {
        return next();
    }
    // 認証されていない場合は、専用ページにリダイレクト
    res.redirect('/please-verify');
};

/**
 * reCAPTCHAトークンを検証するミドルウェア
 */
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
  verifyRecaptcha
};