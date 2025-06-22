const admin = require('firebase-admin');
const db = admin.firestore();

exports.showUserProfileByHandle = async (req, res) => {
    try {
        const handle = req.params.handle;
        const userSnapshot = await db.collection('users').where('handle', '==', handle).limit(1).get();

        if (userSnapshot.empty) {
            return res.status(404).render('404', { title: 'ユーザーが見つかりません' });
        }
        
        const userDoc = userSnapshot.docs[0];
        const userProfile = userDoc.data();
        const targetUserId = userDoc.id;

        const novelsSnapshot = await db.collection('novels')
            .where('authorId', '==', targetUserId)
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .get();
        
        const userNovels = novelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.render('user-profile', {
            title: `${userProfile.username}のプロフィール`,
            profileData: { ...userProfile, uid: targetUserId },
            novels: userNovels
        });

    } catch (error) {
        console.error('ハンドル名によるプロフィール表示エラー:', error);
        res.status(500).send('エラーが発生しました。');
    }
};