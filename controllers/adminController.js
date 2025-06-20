const admin = require('firebase-admin');
const db = admin.firestore();

// ユーザー管理ページを表示
exports.showUsersPage = async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const authUsers = listUsersResult.users;

        // Firestoreから役割情報を取得
        const usersSnapshot = await db.collection('users').get();
        const firestoreUsers = {};
        usersSnapshot.forEach(doc => {
            firestoreUsers[doc.id] = doc.data();
        });

        // AuthとFirestoreの情報をマージ
        const users = authUsers.map(user => {
            return {
                uid: user.uid,
                email: user.email,
                username: user.displayName,
                role: firestoreUsers[user.uid]?.role || '不明',
                createdAt: new Date(user.metadata.creationTime).toLocaleString('ja-JP'),
            };
        });

        res.render('admin/users', {
            title: 'ユーザー管理',
            users: users
        });
    } catch (error) {
        console.error('ユーザーリストの取得エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// ユーザーの役割を更新
exports.updateUserRole = async (req, res) => {
    const { uid, role } = req.body;
    try {
        await db.collection('users').doc(uid).update({ role: role });
        res.redirect('/admin/users');
    } catch (error) {
        console.error('役割の更新エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// ユーザーを削除
exports.deleteUser = async (req, res) => {
    const { uid } = req.body;
    try {
        // Authenticationから削除
        await admin.auth().deleteUser(uid);
        // Firestoreから削除
        await db.collection('users').doc(uid).delete();
        
        res.redirect('/admin/users');
    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};