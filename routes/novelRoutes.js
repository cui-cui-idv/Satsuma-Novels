// routes/novelRoutes.js

const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// --- 1. 最も固定的なルート ---
router.get('/novels/new', isAuthenticated, (req, res) => {
    res.render('new-series', { title: '新しいシリーズを開始' });
});

// 小説を新規作成（シリーズとして）
router.post('/novels', isAuthenticated, novelController.createNovel);


// --- 2. より深い階層、具体的なルート ---
// 新しい話の投稿ページを表示
router.get('/novels/:novelId/episodes/new', isAuthenticated, novelController.showNewEpisodePage);

// 新しい話をDBに作成
router.post('/novels/:novelId/episodes', isAuthenticated, novelController.createEpisode);

// エピソード閲覧ページを表示
router.get('/novels/:novelId/episodes/:episodeId', novelController.showEpisodePage);

// 小説編集ページを表示 (シリーズ情報の編集)
router.get('/novels/:id/edit', isAuthenticated, novelController.showNovelEditPage);

// 小説を更新 (シリーズ情報の更新)
router.post('/novels/:id/edit', isAuthenticated, novelController.updateNovel);

// いいね処理
router.post('/novels/:id/like', isAuthenticated, novelController.toggleLike);


// --- 3. 最も汎用的なルート（必ず最後に置く） ---
// 小説詳細（目次）ページを表示
router.get('/novels/:id', novelController.showNovelPage);


module.exports = router;