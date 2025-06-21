// app.js

require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const crypto = require('crypto');

const admin = require('firebase-admin');
const fs = require('fs'); // ← ファイルシステムモジュールを読み込む

// --- Firebase Admin SDKの初期化 ---
const serviceAccountKeyPath = './serviceAccountKey.json';
let serviceAccount;

if (fs.existsSync(serviceAccountKeyPath)) {
  // ファイルが存在する場合：serviceAccountKey.json を使う
  console.log('serviceAccountKey.json を使用してFirebaseを初期化します。');
  serviceAccount = require(serviceAccountKeyPath);
} else if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  // ファイルが存在しない場合：環境変数から認証情報を作成
  console.log('環境変数を使用してFirebaseを初期化します。');
  serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // 環境変数内の改行コード(\n)を、実際の改行に変換する
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
} else {
  // どちらも見つからない場合：エラーで停止
  console.error('Firebase Admin SDK の認証情報が見つかりません。');
  console.error('serviceAccountKey.json を配置するか、関連する環境変数を設定してください。');
  process.exit(1); // アプリケーションを終了
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --- Expressアプリケーションのセットアップ ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- ミドルウェアの設定 ---
app.use(express.json()); // JSON形式のリクエストボディをパース
app.use(express.urlencoded({ extended: true })); // URLエンコードされたリクエストボディをパース
app.use(express.static('public')); // publicディレクトリを静的ファイル配信用に設定
app.use(cookieParser());

// セッション管理
app.use(cookieSession({
    name: 'satsuma-session', // Cookieの名前
    keys: ['satsuma-novels-secret-key', 'another-secret-key'], // 署名に使う秘密鍵（複数設定可能）
    
    // Cookieのオプション
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

// ビューエンジンの設定
app.set('view engine', 'ejs');

// --- グローバル変数 ---
// 全てのビューでユーザー情報とFirebase設定を使えるようにする
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    // GravatarのURLを生成するヘルパー関数
    res.locals.getGravatarUrl = (email) => {
        if (!email) {
            // メールアドレスがない場合のデフォルト画像
            return 'https://www.gravatar.com/avatar/?d=retro';
        }
        const trimmedEmail = email.trim().toLowerCase();
        const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex');
        // s=サイズ(ピクセル), d=デフォルト画像の種類(retroは8bit風)
        return `https://www.gravatar.com/avatar/${hash}?s=200&d=retro`;
    };
    res.locals.firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
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

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', novelRoutes);
app.use('/', adminRoutes);
app.use('/', profileRoutes);
app.use('/', tagRoutes);
app.use('/', likeRoutes);
app.use('/', historyRoutes);

// --- ▼▼▼ 404 Not Found ハンドラ ▼▼▼ ---
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: 'ページが見つかりません'
    });
});

// --- サーバーの起動 ---
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました: http://localhost:${PORT}`);
});