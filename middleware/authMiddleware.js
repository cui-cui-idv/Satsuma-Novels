const admin = require('firebase-admin');
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
    // 管理者は認証チェックをスキップ
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    // email_verifiedがtrueならOK
    if (req.session.user && req.session.user.email_verified) {
        return next();
    }
    // 認証されていない場合はエラーメッセージを表示（専用ページにリダイレクトするのがより親切）
    res.status(403).send('この機能を利用するには、メールアドレスの認証を完了させてください。');
};


// 作成した全ての関数を外部から使えるようにエクスポートする
module.exports = {
  isAuthenticated,
  hasRole,
  isVerified
};