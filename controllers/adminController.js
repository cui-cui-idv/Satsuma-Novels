const admin = require('firebase-admin');
const db = admin.firestore();

// ユーザー管理ページを表示
exports.showUsersPage = async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const authUsers = listUsersResult.users;

        // Firestoreから全ユーザーの情報を一度に取得
        const usersSnapshot = await db.collection('users').get();
        const firestoreUsers = {};
        usersSnapshot.forEach(doc => {
            firestoreUsers[doc.id] = doc.data();
        });

        // AuthとFirestoreの情報をマージ
        const users = authUsers.map(user => {
            const firestoreData = firestoreUsers[user.uid] || {}; // データがない場合も考慮
            return {
                uid: user.uid,
                email: user.email,
                username: user.displayName,
                role: firestoreData.role || '不明',
                handle: firestoreData.handle || null,
                createdAt: new Date(user.metadata.creationTime).toLocaleString('ja-JP'),
            };
        });

        res.render('admin/users', {
            title: 'ユーザー管理',
            users: users,
            // ページネーション用のトークンなども将来的に渡せる
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

// 小説管理ページを表示
exports.showNovelsPage = async (req, res) => {
    try {
        const novelsSnapshot = await db.collection('novels').orderBy('createdAt', 'desc').get();
        const novels = [];
        novelsSnapshot.forEach(doc => {
            novels.push({ id: doc.id, ...doc.data() });
        });

        res.render('admin/novels', {
            title: '小説管理',
            novels: novels
        });
    } catch (error) {
        console.error('小説リストの取得エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// 小説のステータスを更新
exports.updateNovelStatus = async (req, res) => {
    const { novelId, status } = req.body;
    try {
        await db.collection('novels').doc(novelId).update({ status: status });
        res.redirect('/admin/novels');
    } catch (error) {
        console.error('小説ステータスの更新エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// 小説を削除
exports.deleteNovel = async (req, res) => {
    const { novelId } = req.body;
    try {
        await db.collection('novels').doc(novelId).delete();
        res.redirect('/admin/novels');
    } catch (error) {
        console.error('小説の削除エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// ユーザー編集ページを表示
exports.showUserEditPage = async (req, res) => {
    try {
        const userId = req.params.id;
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).render('404', { title: 'ユーザーが見つかりません' });
        }
        res.render('admin/edit-user', {
            title: 'ユーザー編集',
            userData: { id: userDoc.id, ...userDoc.data() }
        });
    } catch (error) {
        console.error('ユーザー編集ページの表示エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// ユーザー情報を更新
exports.updateUserByAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username } = req.body; // 今回はusernameのみを受け取る

        // 1. Firebase Authenticationの表示名を更新
        await admin.auth().updateUser(userId, {
            displayName: username
        });

        // 2. Firestoreのユーザー情報を更新
        await db.collection('users').doc(userId).update({
            username: username
        });

        res.redirect('/admin/users');
    } catch (error) {
        console.error('管理者によるユーザー更新エラー:', error);
        res.status(500).send('更新中にエラーが発生しました。');
    }
};