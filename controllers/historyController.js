const admin = require('firebase-admin');
const db = admin.firestore();

exports.showHistoryPage = async (req, res) => {
    try {
        const userId = req.session.user.uid;
        // 閲覧履歴を最新50件まで取得
        const historySnapshot = await db.collection('users').doc(userId).collection('history')
            .orderBy('viewedAt', 'desc')
            .limit(50)
            .get();
        
        if (historySnapshot.empty) {
            // 履歴がなければ空の配列を渡してページを表示
            return res.render('history', { title: '閲覧履歴', novels: [] });
        }

        // 履歴にある小説のIDリストを取得
        const novelIds = historySnapshot.docs.map(doc => doc.id);

        // IDリストを使って小説情報を一括で取得 (inクエリは30件までの制限があるため、必要に応じて分割)
        const novelsSnapshot = await db.collection('novels')
            .where(admin.firestore.FieldPath.documentId(), 'in', novelIds.slice(0, 30))
            .get();
        
        // 扱いやすいように、小説IDをキーにしたマップを作成
        const novelsMap = new Map();
        novelsSnapshot.forEach(doc => {
            novelsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 閲覧履歴の順番通りに小説データを並べ替える
        const sortedNovels = novelIds
            .map(id => novelsMap.get(id))
            .filter(novel => novel); // 削除された小説などを除外

        res.render('history', {
            title: '閲覧履歴',
            novels: sortedNovels
        });

    } catch (error) {
        console.error("閲覧履歴ページの表示エラー:", error);
        res.status(500).send('エラーが発生しました。');
    }
};