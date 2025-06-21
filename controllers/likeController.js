const admin = require('firebase-admin');
const db = admin.firestore();

exports.showLikedNovels = async (req, res) => {
    try {
        const userId = req.session.user.uid;
        const likesSnapshot = await db.collection('users').doc(userId).collection('likes').orderBy('createdAt', 'desc').get();

        if (likesSnapshot.empty) {
            return res.render('liked-novels', { title: 'いいねした小説', novels: [] });
        }

        // いいねした小説のIDリストを取得
        const novelIds = likesSnapshot.docs.map(doc => doc.id);

        // IDリストを使って小説情報を取得 (inクエリは30件まで)
        const novelsSnapshot = await db.collection('novels').where(admin.firestore.FieldPath.documentId(), 'in', novelIds).get();
        const novels = novelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.render('liked-novels', { title: 'いいねした小説', novels: novels });
    } catch (error) {
        console.error("いいね一覧の表示エラー:", error);
        res.status(500).send('エラーが発生しました。');
    }
};