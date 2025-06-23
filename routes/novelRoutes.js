const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { isAuthenticated, isVerified } = require('../middleware/authMiddleware');

// --- 1. シリーズ作成ルート ---
router.get('/novels/new', isAuthenticated, isVerified, (req, res) => {
    res.render('new-series', { title: '新しいシリーズを開始' });
});
router.post('/novels', isAuthenticated, isVerified, novelController.createNovel);


// --- 2. エピソード・編集・いいねなど、より具体的なルート ---
// ★★★ ルートの順番を修正しました ★★★

// 新しい話の投稿ページを表示
router.get('/novels/:novelId/episodes/new', isAuthenticated, isVerified, novelController.showNewEpisodePage);

// エピソード編集ページを表示（汎用的な :episodeId ルートより上に配置）
router.get('/novels/:novelId/episodes/:episodeId/edit', isAuthenticated, novelController.showEpisodeEditPage);

// エピソード閲覧ページを表示
router.get('/novels/:novelId/episodes/:episodeId', novelController.showEpisodePage);

// 新しい話をDBに作成
router.post('/novels/:novelId/episodes', isAuthenticated, isVerified, novelController.createEpisode);

// エピソードを更新
router.post('/novels/:novelId/episodes/:episodeId/edit', isAuthenticated, novelController.updateEpisode);


// シリーズ情報の編集ページを表示 (汎用的な :id ルートより上に配置)
router.get('/novels/:id/edit', isAuthenticated, novelController.showNovelEditPage);

// シリーズ情報を更新
router.post('/novels/:id/edit', isAuthenticated, novelController.updateNovel);

// いいね処理
router.post('/novels/:id/like', isAuthenticated, novelController.toggleLike);


// --- 3. 最も汎用的なルート（必ず最後に置く） ---
// 小説詳細（目次）ページを表示
router.get('/novels/:id', novelController.showNovelPage);


module.exports = router;