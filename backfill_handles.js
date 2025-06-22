// backfill_handles.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // あなたのサービスアカウントキー

// Firebase Admin SDKを初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backfillUserHandles() {
  console.log('ハンドル名が設定されていないユーザーの検索を開始します...');

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('ユーザーが見つかりませんでした。');
      return;
    }

    // 変更対象のユーザーを格納する配列
    const usersToUpdate = [];
    snapshot.forEach(doc => {
      // ドキュメントに 'handle' フィールドが存在しない、または空の場合
      if (!doc.data().handle) {
        usersToUpdate.push({ id: doc.id, ...doc.data() });
      }
    });

    if (usersToUpdate.length === 0) {
      console.log('ハンドル名が未設定のユーザーはいません。処理を終了します。');
      return;
    }

    console.log(`${usersToUpdate.length} 人のユーザーに、新しいハンドル名を設定します。`);
    
    // バッチ処理を開始
    const batch = db.batch();

    for (const user of usersToUpdate) {
      // user_ + 8桁のランダムな数字でハンドル名を生成
      const newHandle = `user_${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      console.log(`  - ユーザーID: ${user.id} -> 新ハンドル: @${newHandle}`);
      
      const userDocRef = db.collection('users').doc(user.id);
      batch.update(userDocRef, { handle: newHandle });
    }

    // バッチ処理を確定
    await batch.commit();

    console.log('全てのユーザーのハンドル名設定が完了しました！');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
backfillUserHandles();