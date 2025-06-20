// middleware/authMiddleware.js

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
        // ログインしていることが前提
        if (!req.session.user) {
            return res.status(401).send('認証されていません');
        }

        const userRole = req.session.user.role;
        
        if (roles.includes(userRole)) {
            return next();
        } else {
            // 権限がない場合はホームページなどにリダイレクトするか、エラーメッセージを表示
            res.status(403).send('このページへのアクセス権限がありません。');
        }
    };
};

module.exports = { isAuthenticated, hasRole };