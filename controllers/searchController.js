const admin = require('firebase-admin');
const db = admin.firestore();

exports.showSearchResults = async (req, res) => {
    try {
        const query = req.query.q || ''; // URLクエリから検索語を取得

        if (!query) {
            // 検索語がなければ、空の状態で検索ページを表示
            return res.render('search-results', {
                title: '検索',
                query: '',
                novels: [],
                users: []
            });
        }

        // --- 2つの検索を並行して実行 ---
        // \uf8ff は、前方一致検索を行うための特殊な文字コードです
        const novelQuery = db.collection('novels')
            .where('status', '==', 'published') // 公開中の小説のみ
            .where('title', '>=', query)
            .where('title', '<=', query + '\uf8ff')
            .limit(10)
            .get();
        
        const userQuery = db.collection('users')
            .where('username', '>=', query)
            .where('username', '<=', query + '\uf8ff')
            .limit(10)
            .get();

        const [novelSnapshot, userSnapshot] = await Promise.all([novelQuery, userQuery]);

        const novels = novelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.render('search-results', {
            title: `「${query}」の検索結果`,
            query: query,
            novels: novels,
            users: users
        });

    } catch (error) {
        console.error("検索エラー:", error);
        // 【重要】インデックスがない場合のエラーハンドリング
        if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
            const errorMessage = `<h2>データベースエラー</h2><p>検索に必要なデータベースのインデックスが作成されていません。</p><p>サーバーのコンソールログに出力されているURLにアクセスして、インデックスを作成してください。</p>`;
            return res.status(500).send(errorMessage);
        }
        res.status(500).send('検索中にエラーが発生しました。');
    }
};