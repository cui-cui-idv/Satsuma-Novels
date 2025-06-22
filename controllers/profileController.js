const admin = require('firebase-admin');
const db = admin.firestore();

exports.showProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.uid;

        // 1. ユーザー自身のプロフィール情報（自己紹介など）を取得
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            // 万が一ユーザーデータがなければエラー
            return res.status(404).send('ユーザーデータが見つかりません');
        }
        const userProfile = userDoc.data();

        // 2. ユーザーが投稿した小説のリストを取得
        const novelsSnapshot = await db.collection('novels')
                                     .where('authorId', '==', userId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
        
        const userNovels = [];
        novelsSnapshot.forEach(doc => {
            userNovels.push({ id: doc.id, ...doc.data() });
        });

        // 3. プロフィール情報と小説リストの両方をビューに渡す
        res.render('profile', { 
            title: 'プロフィール',
            profileData: userProfile, // ← ユーザーのプロフィール情報
            novels: userNovels        // ← 投稿した小説リスト
        });

    } catch (error) {
        console.error('プロフィールページの読み込みエラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};

// プロフィール編集ページを表示
exports.showEditPage = async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.session.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).send('ユーザーデータが見つかりません');
        }
        res.render('profile-edit', {
            title: 'プロフィール編集',
            currentUser: userDoc.data() // Firestoreから最新のデータを渡す
        });
    } catch (error) {
        console.error('プロフィール編集ページの表示エラー:', error);
        res.status(500).send('エラーが発生しました');
    }
};

// プロフィール情報を更新
exports.updateProfile = async (req, res) => {
    try {
        const { uid } = req.session.user;
        const { username, bio } = req.body;

        // 1. Firestoreのユーザー情報を更新
        await db.collection('users').doc(uid).update({
            username: username,
            bio: bio || '' // bioが空の場合も考慮
        });

        // 2. Firebase Authenticationの表示名を更新
        await admin.auth().updateUser(uid, {
            displayName: username
        });

        // 3. セッション情報を更新
        req.session.user.username = username;

        // すぐにリダイレクトする
        res.redirect('/profile');

    } catch (error)
    {
        console.error('プロフィール更新エラー:', error);
        res.status(500).send('更新中にエラーが発生しました');
    }
};

// 他のユーザーも見ることができる公開プロフィールページ
exports.showUserProfilePage = async (req, res) => {
    try {
        const targetUserId = req.params.id; // URLから表示したいユーザーのIDを取得

        // 1. 表示対象のユーザー情報を取得
        const userDoc = await db.collection('users').doc(targetUserId).get();
        if (!userDoc.exists) {
            return res.status(404).render('404', { title: 'ユーザーが見つかりません' });
        }
        const userProfile = userDoc.data();

        // 2. そのユーザーが投稿した「公開済み」の小説リストを取得
        const novelsSnapshot = await db.collection('novels')
            .where('authorId', '==', targetUserId)
            .where('status', '==', 'published') // 公開(published)の作品のみ
            .orderBy('createdAt', 'desc')
            .get();
        
        const userNovels = novelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. user-profile.ejs を使ってページをレンダリング
        res.render('user-profile', {
            title: `${userProfile.username}のプロフィール`,
            profileData: userProfile, // 表示するユーザーのプロフィール
            novels: userNovels       // 表示するユーザーの公開済み小説
        });

    } catch (error) {
        console.error('公開プロフィールページの表示エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};