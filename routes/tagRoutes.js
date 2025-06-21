const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/tags/:tagName', tagController.showNovelsByTag);

module.exports = router;