const admin = require('firebase-admin');
const db = admin.firestore();

exports.showNovelsByTag = async (req, res) => {
    try {
        const tagName = req.params.tagName;
        // 'tags'配列に指定のタグ名を含み、かつ'published'の小説を検索
        const snapshot = await db.collection('novels')
            .where('tags', 'array-contains', tagName)
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .get();

        const novels = [];
        snapshot.forEach(doc => {
            novels.push({ id: doc.id, ...doc.data() });
        });

        res.render('novels-by-tag', {
            title: `#${tagName} の小説一覧`,
            tagName: tagName,
            novels: novels
        });

    } catch (error) {
        console.error("タグ別一覧ページの表示エラー:", error);
        // 【重要】インデックスがない場合のエラーハンドリング
        if (error.code === 'FAILED_PRECONDITION') {
            return res.status(500).send('データベースのインデックスが必要です。エラーログのURLから作成してください。');
        }
        res.status(500).send('エラーが発生しました');
    }
};