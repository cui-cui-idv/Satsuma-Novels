const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

// /sitemap.xml へのアクセスでサイトマップを生成
router.get('/sitemap.xml', sitemapController.generateSitemap);

module.exports = router;