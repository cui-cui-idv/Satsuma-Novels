// controllers/authController.js
const admin = require('firebase-admin');
const db = admin.firestore();

// 登録ページを表示
exports.showRegisterPage = (req, res) => {
    res.render('register', { title: '新規登録' });
};

// ユーザー登録処理
exports.registerUser = async (req, res) => {
    const { email, password, username } = req.body;
    try {

        // 1. ユーザー名が既に存在するかチェック
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();

        if (!snapshot.empty) {
            // ユーザー名が既に使用されている場合
            console.log(`ユーザー名の重複: ${username}`);
            return res.render('register', {
                title: '新規登録',
                error: 'このユーザー名は既に使用されています。' // エラーメッセージを渡す
            });
        }

        // 2. Firebase Authenticationでユーザーを作成
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: username,
        });

        // 2. Firestoreにユーザー情報を保存（役割を付与）
        // 最初のユーザーを管理者にすることも可能
        // const userCount = (await db.collection('users').get()).size;
        // const role = userCount === 0 ? 'admin' : 'general';

        const role = 'general'; // デフォルトは一般ユーザー

        await db.collection('users').doc(userRecord.uid).set({
            username: username,
            email: email,
            role: role, // 役割: general, moderator, sub-admin, admin
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.redirect('/login');

    // controllers/authController.js (registerUser 関数の catch ブロック)
// ... tryブロックはそのまま ...
} catch (error) {
    console.error('登録エラー:', error);
    let errorMessage = '登録中にエラーが発生しました。';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'このメールアドレスは既に使用されています。';
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = '有効なメールアドレスを入力してください。';
    }
    res.render('register', {
        title: '新規登録',
        error: errorMessage // 修正したエラーメッセージを渡す
    });
}
};

// ログインページを表示
exports.showLoginPage = (req, res) => {
    res.render('login', { title: 'ログイン' });
};

// ログイン処理
exports.loginUser = async (req, res) => {
    const { idToken } = req.body;
    try {
        // IDトークンを検証
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Firestoreからユーザーの役割を取得
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).send('ユーザーデータが見つかりません');
        }
        const userData = userDoc.data();

        // セッションにユーザー情報を保存
        req.session.user = {
            uid: uid,
            email: userData.email,
            username: userData.username,
            role: userData.role
        };
        
        // すぐにレスポンスを返す
        res.status(200).send({ message: 'ログイン成功' });

    } catch (error) {
        console.error('ログインエラー:', error);
        res.status(401).send('ログインに失敗しました: ' + error.message);
    }
};

// ログアウト処理
exports.logoutUser = (req, res) => {
    // セッションをnullにすることで、Cookieがクリアされる
    req.session = null;
    res.redirect('/');
};
// パスワードリセット要求ページを表示
exports.showForgotPasswordPage = (req, res) => {
    res.render('forgot-password', { title: 'パスワードをリセット' });
};

// パスワードリセットメールを送信
exports.handleForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Firebase Authenticationの機能を使ってリセットメールを送信
        await admin.auth().generatePasswordResetLink(email);
        // 実際には上のリンク生成だけでメールが飛ぶ設定になっていることが多いですが、
        // sendPasswordResetEmail を使うのがより確実です。
        // ※ただし、テンプレートで設定したアクションURLが自動で使われます。
        await admin.auth().sendPasswordResetEmail(email);
        
        // ユーザーにメールアドレスの存在を知らせないように、常に成功メッセージを表示するのがセキュリティ上好ましい
        res.render('forgot-password-sent', { title: 'メールを送信しました' });

    } catch (error) {
        // エラーが発生しても、ユーザーには成功したように見せかける
        console.error("Password reset error:", error);
        res.render('forgot-password-sent', { title: 'メールを送信しました' });
    }
};

// パスワードリセット実行ページを表示
exports.showResetPasswordPage = (req, res) => {
    // このページでは、実際の処理はクライアントサイドのJavaScriptで行う
    // oobCodeなどのクエリパラメータはJSで取得する
    res.render('reset-password-action', { title: '新しいパスワードを設定' });
};