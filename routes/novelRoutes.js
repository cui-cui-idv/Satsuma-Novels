const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// 小説投稿ページを表示 (要ログイン)
router.get('/novels/new', isAuthenticated, novelController.showNewNovelPage);

// 小説を新規作成 (要ログイン)
router.post('/novels', isAuthenticated, novelController.createNovel);

module.exports = router;