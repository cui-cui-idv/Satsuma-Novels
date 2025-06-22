require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// --- Firebase Admin SDKの初期化 ---
const serviceAccountKeyPath = './serviceAccountKey.json';
let serviceAccount;
if (fs.existsSync(serviceAccountKeyPath)) {
    console.log('serviceAccountKey.json を使用してFirebaseを初期化します。');
    serviceAccount = require(serviceAccountKeyPath);
} else if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.log('環境変数を使用してFirebaseを初期化します。');
    serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
} else {
    console.error('Firebase Admin SDK の認証情報が見つかりません。');
    console.error('serviceAccountKey.json を配置するか、関連する環境変数を設定してください。');
    process.exit(1);
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// --- Expressアプリケーションのセットアップ ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- ミドルウェアの設定 ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(cookieSession({
    name: 'satsuma-session',
    keys: [process.env.SESSION_SECRET_KEY || 'local-default-secret-key-for-dev-env'],
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30日間
}));

// ビューエンジンの設定
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- グローバル変数 ---
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.getGravatarUrl = (email) => {
        if (!email) {
            return 'https://www.gravatar.com/avatar/?d=retro';
        }
        const trimmedEmail = email.trim().toLowerCase();
        const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex');
        return `https://www.gravatar.com/avatar/${hash}?s=200&d=retro`;
    };
    res.locals.firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        recaptchaSiteKey: process.env.RECAPTCHA_V3_SITE_KEY
    };
    next();
});

// --- ルーティング ---
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const novelRoutes = require('./routes/novelRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tagRoutes = require('./routes/tagRoutes');
const likeRoutes = require('./routes/likeRoutes.js');
const historyRoutes = require('./routes/historyRoutes.js');
const accountRoutes = require('./routes/accountRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', novelRoutes);
app.use('/', adminRoutes);
app.use('/', profileRoutes);
app.use('/', tagRoutes);
app.use('/', likeRoutes);
app.use('/', historyRoutes);
app.use('/', accountRoutes);
app.use('/', searchRoutes);
app.use('/', userRoutes);

// --- 404 Not Found ハンドラ ---
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: 'ページが見つかりません'
    });
});

// --- サーバーの起動 ---
// Vercel環境では 'app.listen' は呼び出されない
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`サーバーがポート${PORT}で起動しました: http://localhost:${PORT}`);
    });
}
module.exports = app;