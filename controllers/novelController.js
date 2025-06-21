const admin = require('firebase-admin');
const db = admin.firestore();

// 小説投稿ページを表示
exports.showNewNovelPage = (req, res) => {
    res.render('new-novel', { title: '新しい小説を書く' });
};

// 小説を作成し、Firestoreに保存
exports.createNovel = async (req, res) => {
    try {
        // フォームからは content を受け取らない
        const { title, description, tags } = req.body;
        const { uid, username } = req.session.user;

        if (!title) {
            return res.status(400).send('シリーズタイトルは必須です。');
        }

        const tagArray = tags
            ? tags.split(/[,、\s]+/).filter(tag => tag.length > 0)
            : [];

        // 保存するシリーズデータ (content は含まない)
        const newNovelSeries = {
            title,
            description: description || '',
            tags: tagArray,
            status: 'draft', // 最初は下書き状態が親切
            authorId: uid,
            authorName: username,
            likeCount: 0,
            episodeCount: 0, // 話数はまだ0
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Firestoreに新しい「小説シリーズ」ドキュメントを追加
        const novelRef = await db.collection('novels').add(newNovelSeries);

        // tagsコレクションへの保存ロジックはそのまま
        if (tagArray.length > 0) {
            const batch = db.batch();
            tagArray.forEach(tag => {
                const tagRef = db.collection('tags').doc(tag);
                batch.set(tagRef, { name: tag }, { merge: true });
            });
            await batch.commit();
        }
        
        // ★★★ 最重要ポイント ★★★
        // 作成したシリーズの「新しい話の追加ページ」に直接リダイレクトする
        res.redirect(`/novels/${novelRef.id}/episodes/new`);

    } catch (error) {
        console.error('新しいシリーズの作成エラー:', error);
        res.status(500).send('作成中にエラーが発生しました。');
    }
};

exports.showNovelPage = async (req, res) => {
    try {
        const novelId = req.params.id;
        const novelRef = db.collection('novels').doc(novelId);
        const novelDoc = await novelRef.get();

        if (!novelDoc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }

        // エピソード一覧を取得（公開されているものを順番に）
        const episodesSnapshot = await novelRef.collection('episodes')
            .where('status', '==', 'published')
            .orderBy('order', 'asc') // orderフィールドで昇順に並び替え
            .get();
        
        const episodes = episodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // isLikedのチェックロジックなどは、シリーズ自体へのいいねとして残しても良い
        let isLiked = false; // (いいね機能があれば、ここのロジックは残す)

        res.render('novel-detail', {
            title: novelDoc.data().title,
            novel: { id: novelDoc.id, ...novelDoc.data() },
            episodes: episodes,
            isLiked: isLiked
        });

    } catch (error) {
        console.error("小説目次ページの表示エラー:", error);
        res.status(500).send('エラーが発生しました');
    }
};

// 小説編集ページを表示
exports.showNovelEditPage = async (req, res) => {
    try {
        const novelId = req.params.id;
        const doc = await db.collection('novels').doc(novelId).get();

        if (!doc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }

        const novel = { id: doc.id, ...doc.data() };

        // 【重要】作者本人かどうかのチェック
        if (novel.authorId !== req.session.user.uid) {
            return res.status(403).send('このページにアクセスする権限がありません。');
        }

        res.render('novel-edit', {
            title: `編集: ${novel.title}`,
            novel: { id: doc.id, ...novel }
        });

    } catch (error) {
        console.error("小説編集ページの表示エラー:", error);
        res.status(500).send('エラーが発生しました');
    }
};

// 小説を更新
exports.updateNovel = async (req, res) => {
    try {
        const novelId = req.params.id;
        const { title, description, content, status, tags } = req.body;
        const novelRef = db.collection('novels').doc(novelId);

        // 【重要】更新前にもう一度、作者本人かチェック
        const doc = await novelRef.get();
        if (!doc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }
        if (doc.data().authorId !== req.session.user.uid) {
            return res.status(403).send('この作品を編集する権限がありません。');
        }

        const tagArray = tags
            ? tags.split(/[,、\s]+/).filter(tag => tag.length > 0)
            : [];
            
        // Firestoreのドキュメントを更新
        await novelRef.update({
            title,
            description,
            content,
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // 更新日時を記録
        });

        const batch = db.batch();
        tagArray.forEach(tag => {
            const tagRef = db.collection('tags').doc(tag);
            batch.set(tagRef, { name: tag }, { merge: true });
        });
        await batch.commit();
        // 更新後は詳細ページにリダイレクト
        res.redirect(`/novels/${novelId}`);

    } catch (error) {
        console.error("小説の更新エラー:", error);
        res.status(500).send('更新中にエラーが発生しました');
    }
};

exports.toggleLike = async (req, res) => {
    const novelId = req.params.id;
    const userId = req.session.user.uid;

    const novelRef = db.collection('novels').doc(novelId);
    const userLikeRef = db.collection('users').doc(userId).collection('likes').doc(novelId);

    try {
        await db.runTransaction(async (transaction) => {
            const userLikeDoc = await transaction.get(userLikeRef);

            if (userLikeDoc.exists) {
                // いいねが存在する場合 → いいねを解除
                transaction.delete(userLikeRef);
                transaction.update(novelRef, { 
                    likeCount: admin.firestore.FieldValue.increment(-1) 
                });
            } else {
                // いいねが存在しない場合 → いいねする
                transaction.set(userLikeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
                transaction.update(novelRef, { 
                    likeCount: admin.firestore.FieldValue.increment(1) 
                });
            }
        });
        // 成功時のレスポンス
        res.status(200).json({ success: true, message: 'いいねの状態を更新しました。' });
    } catch (error) {
        console.error("いいね処理エラー:", error);
        res.status(500).json({ success: false, message: 'エラーが発生しました。' });
    }
};

exports.showEpisodePage = async (req, res) => {
    try {
        const { novelId, episodeId } = req.params;
        const episodeRef = db.collection('novels').doc(novelId).collection('episodes').doc(episodeId);
        const episodeDoc = await episodeRef.get();

        if (!episodeDoc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }

        const episode = episodeDoc.data();
        // アクセス制御（下書きは本人と管理者のみ）はここに追加

        // 前後のエピソードへのリンクを取得
        const episodesRef = db.collection('novels').doc(novelId).collection('episodes');
        const prevSnapshot = await episodesRef.where('order', '<', episode.order).orderBy('order', 'desc').limit(1).get();
        const nextSnapshot = await episodesRef.where('order', '>', episode.order).orderBy('order', 'asc').limit(1).get();

        const prevEpisodeId = prevSnapshot.empty ? null : prevSnapshot.docs[0].id;
        const nextEpisodeId = nextSnapshot.empty ? null : nextSnapshot.docs[0].id;

        res.render('episode-detail', {
            title: episode.title,
            novelId: novelId,
            episode: episode,
            prevEpisodeId: prevEpisodeId,
            nextEpisodeId: nextEpisodeId
        });
    } catch (error) {
        console.error("エピソード閲覧ページのエラー:", error);
        res.status(500).send('エラーが発生しました');
    }
};

// 新しい話の投稿ページを表示
exports.showNewEpisodePage = async (req, res) => {
    try {
        const novelId = req.params.novelId;
        const novelDoc = await db.collection('novels').doc(novelId).get();

        if (!novelDoc.exists) {
            return res.status(404).render('404', { title: '作品が見つかりません' });
        }

        // 作者本人かチェック
        if (novelDoc.data().authorId !== req.session.user.uid) {
            return res.status(403).send('この作品に話を追加する権限がありません。');
        }

        res.render('new-episode', {
            title: '新しい話を追加',
            novel: { id: novelDoc.id, ...novelDoc.data() }
        });
    } catch (error) {
        console.error("新しい話の投稿ページ表示エラー:", error);
        res.status(500).send('エラーが発生しました。');
    }
};


// 新しい話を作成して保存
exports.createEpisode = async (req, res) => {
    try {
        const novelId = req.params.novelId;
        const { title, content, status } = req.body; // statusもフォームから受け取る想定
        const novelRef = db.collection('novels').doc(novelId);

        // --- 安全のため、ここでも作者本人かチェック ---
        const novelDoc = await novelRef.get();
        if (!novelDoc.exists || novelDoc.data().authorId !== req.session.user.uid) {
            return res.status(403).send('権限がありません。');
        }

        // --- 新しい話の順番（order）を決定 ---
        // 現在の話の数を取得し、それに+1する
        const currentEpisodeCount = novelDoc.data().episodeCount || 0;
        const newOrder = currentEpisodeCount + 1;

        // --- 保存するデータを作成 ---
        const newEpisodeData = {
            title,
            content,
            status: status || 'published', // フォームになければデフォルトで 'published'
            order: newOrder,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            authorId: req.session.user.uid, // 作者IDも記録
        };

        // --- トランザクション/バッチ処理で安全に書き込む ---
        // 1. 新しいエピソードを追加
        // 2. 親の小説ドキュメントの話数(episodeCount)と更新日時を更新
        const batch = db.batch();
        
        const newEpisodeRef = novelRef.collection('episodes').doc(); // 新しいIDを自動生成
        batch.set(newEpisodeRef, newEpisodeData);

        batch.update(novelRef, {
            episodeCount: admin.firestore.FieldValue.increment(1),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();

        // 投稿後は、シリーズの目次ページにリダイレクト
        res.redirect(`/novels/${novelId}`);

    } catch (error) {
        console.error("新しい話の作成エラー:", error);
        res.status(500).send('エラーが発生しました。');
    }
};