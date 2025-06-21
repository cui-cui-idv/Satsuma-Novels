// controllers/indexController.js (新規作成または修正)
const admin = require('firebase-admin');
const db = admin.firestore();

exports.showTopPage = async (req, res) => {
    // ログイン前のヒーローセクション表示は index.ejs 側で処理
    if (!req.session.user) {
        return res.render('index', { title: 'ようこそ' });
    }
    
    try {
        // 人気作品を取得 (いいね数で降順)
        const popularSnapshot = await db.collection('novels')
            .where('status', '==', 'published')
            .orderBy('likeCount', 'desc')
            .limit(6)
            .get();
        const popularNovels = popularSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 新着作品を取得 (作成日で降順)
        const newSnapshot = await db.collection('novels')
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();
        const newNovels = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.render('index', {
            title: 'トップページ',
            popularNovels: popularNovels,
            newNovels: newNovels
        });

    } catch (error) {
        console.error("トップページのデータ取得エラー:", error);
        // 【重要】インデックスがない場合のエラーハンドリング
        if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
            return res.status(500).send('データベースのインデックスが必要です。エラーログのURLから作成してください。人気作品用のインデックス（statusとlikeCount）が不足している可能性があります。');
        }
        res.render('index', { title: 'トップページ', popularNovels: [], newNovels: [] });
    }
};