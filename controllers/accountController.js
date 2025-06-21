const admin = require('firebase-admin');
const db = admin.firestore();

// 設定ページを表示するだけ
exports.showSettingsPage = (req, res) => {
    res.render('account-settings', { title: 'アカウント設定' });
};

// クライアントでFirebase Authのメール更新後、Firestoreのデータも更新する
exports.updateFirestoreEmail = async (req, res) => {
    try {
        const { uid } = req.session.user;
        const { newEmail } = req.body;
        await db.collection('users').doc(uid).update({ email: newEmail });
        // セッション情報も更新
        req.session.user.email = newEmail;
        req.session.save(() => res.status(200).json({ success: true }));
    } catch (error) {
        console.error("Firestoreのメール更新エラー:", error);
        res.status(500).json({ success: false, message: 'データベースの更新に失敗しました。' });
    }
};