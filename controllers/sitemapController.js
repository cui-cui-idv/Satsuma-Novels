const admin = require('firebase-admin');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const db = admin.firestore();

exports.generateSitemap = async (req, res) => {
    try {
        const links = [];
        const baseUrl = `https://novel.militaris.work`; // ご自身の本番環境のURL

        // 1. 静的なページのURLを追加
        const staticPages = ['/', '/privacy-policy', '/login', '/register'];
        staticPages.forEach(page => {
            links.push({ url: page, changefreq: 'weekly', priority: 0.8 });
        });

        // 2. 公開されている全ユーザーのプロフィールページのURLを追加
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.handle) {
                links.push({ url: `/users/@${user.handle}`, changefreq: 'weekly', priority: 0.7 });
            }
        });

        // 3. 全てのタグページのURLを追加
        const tagsSnapshot = await db.collection('tags').get();
        tagsSnapshot.forEach(doc => {
            links.push({ url: `/tags/${doc.id}`, changefreq: 'daily', priority: 0.6 });
        });

        // 4. 公開されている全小説（シリーズ）と全エピソードのURLを追加
        const novelsSnapshot = await db.collection('novels').where('status', '==', 'published').get();
        for (const novelDoc of novelsSnapshot.docs) {
            // シリーズの目次ページ
            links.push({ url: `/novels/${novelDoc.id}`, changefreq: 'daily', priority: 0.9, lastmod: novelDoc.data().lastUpdatedAt.toDate() });
            
            // 各エピソードのページ
            const episodesSnapshot = await db.collection('novels').doc(novelDoc.id).collection('episodes').where('status', '==', 'published').get();
            episodesSnapshot.forEach(episodeDoc => {
                links.push({ url: `/novels/${novelDoc.id}/episodes/${episodeDoc.id}`, changefreq: 'daily', priority: 1.0, lastmod: episodeDoc.data().updatedAt.toDate() });
            });
        }
        
        // サイトマップのストリームを作成
        const stream = new SitemapStream({ hostname: baseUrl });
        
        // ヘッダーを正しく設定
        res.header('Content-Type', 'application/xml');
        
        // ストリームからXMLを生成
        const xmlStream = Readable.from(links).pipe(stream);
        
        // ストリームをレスポンスに直接流す
        xmlStream.pipe(res).on('error', (e) => {
            throw e;
        });

    } catch (error) {
        console.error('サイトマップの生成エラー:', error);
        res.status(500).end();
    }
};