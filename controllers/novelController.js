const admin = require('firebase-admin');
const db = admin.firestore();

//----------------------------------------------------
// シリーズ（小説全体）に関する処理
//----------------------------------------------------

// 新しい「シリーズ」を作成する
exports.createNovel = async (req, res) => {
    try {
        const { title, description, tags } = req.body;
        const { uid, username } = req.session.user;

        if (!title) {
            return res.status(400).send('シリーズタイトルは必須です。');
        }

        const tagArray = tags ? tags.split(/[,、\s]+/).filter(tag => tag.length > 0) : [];

        const newNovelSeries = {
            title,
            description: description || '',
            tags: tagArray,
            status: 'draft',
            authorId: uid,
            authorName: username,
            likeCount: 0,
            episodeCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const novelRef = await db.collection('novels').add(newNovelSeries);

        if (tagArray.length > 0) {
            const batch = db.batch();
            tagArray.forEach(tag => {
                const tagRef = db.collection('tags').doc(tag);
                batch.set(tagRef, { name: tag }, { merge: true });
            });
            await batch.commit();
        }
        
        res.redirect(`/novels/${novelRef.id}/episodes/new`);
    } catch (error) {
        console.error('新しいシリーズの作成エラー:', error);
        res.status(500).send('作成中にエラーが発生しました。');
    }
};

// 小説詳細（目次）ページを表示
exports.showNovelPage = async (req, res) => {
    try {
        const novelId = req.params.id;
        const novelRef = db.collection('novels').doc(novelId);
        const novelDoc = await novelRef.get();

        if (!novelDoc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }

        const novel = { id: novelDoc.id, ...novelDoc.data() };
        
        const episodesSnapshot = await novelRef.collection('episodes').orderBy('order', 'asc').get();
        const episodes = episodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let isLiked = false;
        if (req.session.user) {
            const userLikeRef = db.collection('users').doc(req.session.user.uid).collection('likes').doc(novelId);
            const userLikeDoc = await userLikeRef.get();
            if (userLikeDoc.exists) { isLiked = true; }
        }
        
        res.render('novel-detail', {
            title: novel.title,
            novel: novel,
            episodes: episodes,
            isLiked: isLiked
        });
    } catch (error) {
        console.error("小説目次ページの表示エラー:", error);
        res.status(500).send('エラーが発生しました');
    }
};

// 小説（シリーズ情報）の編集ページを表示
exports.showNovelEditPage = async (req, res) => {
    try {
        const novelId = req.params.id;
        const doc = await db.collection('novels').doc(novelId).get();
        if (!doc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }
        const novel = doc.data();
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

// 小説（シリーズ情報）を更新
exports.updateNovel = async (req, res) => {
    try {
        const novelId = req.params.id;
        const { title, description, content, status, tags } = req.body;
        const novelRef = db.collection('novels').doc(novelId);
        const doc = await novelRef.get();
        if (!doc.exists || doc.data().authorId !== req.session.user.uid) {
            return res.status(403).send('この作品を編集する権限がありません。');
        }
        const tagArray = tags ? tags.split(/[,、\s]+/).filter(tag => tag.length > 0) : [];
        await novelRef.update({
            title,
            description,
            status,
            tags: tagArray,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (tagArray.length > 0) {
            const batch = db.batch();
            tagArray.forEach(tag => {
                const tagRef = db.collection('tags').doc(tag);
                batch.set(tagRef, { name: tag }, { merge: true });
            });
            await batch.commit();
        }
        res.redirect(`/novels/${novelId}`);
    } catch (error) {
        console.error("小説の更新エラー:", error);
        res.status(500).send('更新中にエラーが発生しました');
    }
};

// いいねの状態を切り替える
exports.toggleLike = async (req, res) => {
    const novelId = req.params.id;
    const userId = req.session.user.uid;
    const novelRef = db.collection('novels').doc(novelId);
    const userLikeRef = db.collection('users').doc(userId).collection('likes').doc(novelId);
    try {
        await db.runTransaction(async (transaction) => {
            const userLikeDoc = await transaction.get(userLikeRef);
            if (userLikeDoc.exists) {
                transaction.delete(userLikeRef);
                transaction.update(novelRef, { likeCount: admin.firestore.FieldValue.increment(-1) });
            } else {
                transaction.set(userLikeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
                transaction.update(novelRef, { likeCount: admin.firestore.FieldValue.increment(1) });
            }
        });
        res.status(200).json({ success: true, message: 'いいねの状態を更新しました。' });
    } catch (error) {
        console.error("いいね処理エラー:", error);
        res.status(500).json({ success: false, message: 'エラーが発生しました。' });
    }
};


//----------------------------------------------------
// エピソード（各話）に関する処理
//----------------------------------------------------

// 新しい話の投稿ページを表示
exports.showNewEpisodePage = async (req, res) => {
    try {
        const novelId = req.params.novelId;
        const novelDoc = await db.collection('novels').doc(novelId).get();
        if (!novelDoc.exists) {
            return res.status(404).render('404', { title: '作品が見つかりません' });
        }
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
        const { title, content, status } = req.body;
        const novelRef = db.collection('novels').doc(novelId);
        const novelDoc = await novelRef.get();
        if (!novelDoc.exists || novelDoc.data().authorId !== req.session.user.uid) {
            return res.status(403).send('権限がありません。');
        }
        const currentEpisodeCount = novelDoc.data().episodeCount || 0;
        const newOrder = currentEpisodeCount + 1;
        const newEpisodeData = {
            title,
            content,
            status: status || 'published',
            order: newOrder,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            authorId: req.session.user.uid,
        };
        const batch = db.batch();
        const newEpisodeRef = novelRef.collection('episodes').doc();
        batch.set(newEpisodeRef, newEpisodeData);
        batch.update(novelRef, {
            episodeCount: admin.firestore.FieldValue.increment(1),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await batch.commit();
        res.redirect(`/novels/${novelId}`);
    } catch (error) {
        console.error("新しい話の作成エラー:", error);
        res.status(500).send('エラーが発生しました。');
    }
};

// エピソード閲覧ページを表示
exports.showEpisodePage = async (req, res) => {
    try {
        const { novelId, episodeId } = req.params;
        const novelDoc = await db.collection('novels').doc(novelId).get();
        const episodeDoc = await db.collection('novels').doc(novelId).collection('episodes').doc(episodeId).get();

        if (!novelDoc.exists || !episodeDoc.exists) {
            return res.status(404).render('404', { title: 'ページが見つかりません' });
        }
        
        const novel = novelDoc.data();
        const episode = episodeDoc.data();
        
        if (episode.status === 'draft') {
            if (!req.session.user || (req.session.user.uid !== episode.authorId && req.session.user.role !== 'admin')) {
                return res.status(404).render('404', { title: 'ページが見つかりません' });
            }
        }

        const episodesRef = db.collection('novels').doc(novelId).collection('episodes');
        const prevSnapshot = await episodesRef.where('order', '<', episode.order).orderBy('order', 'desc').limit(1).get();
        const nextSnapshot = await episodesRef.where('order', '>', episode.order).orderBy('order', 'asc').limit(1).get();

        const prevEpisodeId = prevSnapshot.empty ? null : prevSnapshot.docs[0].id;
        const nextEpisodeId = nextSnapshot.empty ? null : nextSnapshot.docs[0].id;

        res.render('episode-detail', {
            title: `${novel.title} - ${episode.title}`,
            novel: { id: novelDoc.id, ...novel },
            episode: episode,
            prevEpisodeId: prevEpisodeId,
            nextEpisodeId: nextEpisodeId
        });
    } catch (error) {
        console.error("エピソード閲覧ページのエラー:", error);
        res.status(500).send('エラーが発生しました');
    }
};
