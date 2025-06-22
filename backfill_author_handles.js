const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backfillAuthorHandles() {
  console.log('小説データへの authorHandle の追加処理を開始します...');

  try {
    // 1. 全ユーザーの情報を取得し、Mapに保存（キー: uid, 値: handle）
    const usersSnapshot = await db.collection('users').get();
    const userHandleMap = new Map();
    usersSnapshot.forEach(doc => {
      if (doc.data().handle) {
        userHandleMap.set(doc.id, doc.data().handle);
      }
    });
    console.log(`${userHandleMap.size} 人のユーザー情報を取得しました。`);

    // 2.【修正点】全ての小説を取得する
    const novelsRef = db.collection('novels');
    const snapshot = await novelsRef.get();

    if (snapshot.empty) {
      console.log('小説データがありません。');
      return;
    }

    // 3. バッチ処理を開始
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach(doc => {
      const novelData = doc.data();
      // 4.【修正点】コードの中で、authorHandleが存在しない小説だけを対象にする
      if (!novelData.authorHandle) {
        const authorHandle = userHandleMap.get(novelData.authorId);

        if (authorHandle) {
          console.log(`  - 小説「${novelData.title}」に @${authorHandle} を設定します。`);
          const novelRef = db.collection('novels').doc(doc.id);
          batch.update(novelRef, { authorHandle: authorHandle });
          updatedCount++;
        } else {
          console.warn(`  - 警告: 小説「${novelData.title}」の作者(ID: ${novelData.authorId})のハンドル名が見つかりません。`);
        }
      }
    });

    if (updatedCount === 0) {
        console.log('authorHandleが未設定の小説はありませんでした。処理を終了します。');
        return;
    }

    // 5. バッチ処理を確定
    await batch.commit();
    console.log(`${updatedCount} 件の小説データの更新が完了しました！`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

backfillAuthorHandles();