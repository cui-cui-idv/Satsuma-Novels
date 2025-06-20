const admin = require('firebase-admin');
const db = admin.firestore();

// 小説投稿ページを表示
exports.showNewNovelPage = (req, res) => {
    res.render('new-novel', { title: '新しい小説を書く' });
};

// 小説を作成し、Firestoreに保存
exports.createNovel = async (req, res) => {
    try {
        const { title, description, content, status } = req.body;
        const { uid, username } = req.session.user; // ログインユーザーの情報を取得

        if (!title || !content) {
            return res.status(400).send('タイトルと本文は必須です。');
        }

        const newNovel = {
            title,
            description,
            content,
            status, // 'published' (公開) or 'draft' (下書き)
            authorId: uid,
            authorName: username,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('novels').add(newNovel);

        res.redirect('/profile'); // 投稿後はプロフィールページにリダイレクト

    } catch (error) {
        console.error('小説の投稿エラー:', error);
        res.status(500).send('小説の投稿中にエラーが発生しました。');
    }
};