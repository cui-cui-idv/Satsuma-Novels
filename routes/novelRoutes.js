const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
// ▼ 1. isVerifiedも一緒に読み込む
const { isAuthenticated, isVerified } = require('../middleware/authMiddleware');

// --- 1. シリーズ作成ルート ---
// 新しいシリーズの作成ページを表示
router.get('/novels/new', isAuthenticated, isVerified, (req, res) => {
    // isVerifiedを追加し、認証済みユーザーのみが作成できるようにする
    res.render('new-series', { title: '新しいシリーズを開始' });
});

// 新しいシリーズをDBに作成
router.post('/novels', isAuthenticated, isVerified, novelController.createNovel);


// --- 2. エピソード・編集・いいねなど、より具体的なルート ---
// 新しい話の投稿ページを表示
router.get('/novels/:novelId/episodes/new', isAuthenticated, isVerified, novelController.showNewEpisodePage);

// 新しい話をDBに作成
router.post('/novels/:novelId/episodes', isAuthenticated, isVerified, novelController.createEpisode);

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