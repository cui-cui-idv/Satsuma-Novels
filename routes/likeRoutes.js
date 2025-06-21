const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/likes', isAuthenticated, likeController.showLikedNovels);

module.exports = router;