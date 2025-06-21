const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// 閲覧履歴ページを表示 (ログイン必須)
router.get('/history', isAuthenticated, historyController.showHistoryPage);

module.exports = router;