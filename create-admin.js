// create-admin.js

require('dotenv').config();
const admin = require('firebase-admin');
const readline = require('readline/promises');

// --- Firebase Admin SDKの初期化 ---
// app.jsと同じ設定を読み込みます
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log('Firebase Admin SDKが初期化されました。');

// --- 対話インターフェースの作成 ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- メイン処理 ---
const createAdminUser = async () => {
  try {
    console.log('\n--- 管理者アカウント作成ツール ---');
    
    // ユーザー情報の質問
    const username = await rl.question('ユーザー名を入力してください: ');
    const email = await rl.question('メールアドレスを入力してください: ');
    const password = await rl.question('パスワードを入力してください (6文字以上): ');
    
    // 役割の選択
    const roles = ['admin', 'sub-admin', 'moderator', 'general'];
    console.log('役割を選択してください:');
    roles.forEach((r, i) => console.log(`  ${i + 1}: ${r}`));
    const roleIndex = await rl.question('番号で選択 (デフォルト: 1. admin): ');
    const selectedRole = roles[parseInt(roleIndex) - 1] || 'admin';

    console.log('\n--- 確認 ---');
    console.log(`ユーザー名: ${username}`);
    console.log(`メールアドレス: ${email}`);
    console.log(`役割: ${selectedRole}`);
    const confirm = await rl.question('この内容で作成しますか？ (y/n): ');

    if (confirm.toLowerCase() !== 'y') {
      console.log('作成をキャンセルしました。');
      return;
    }

    // 1. Firebase Authenticationでユーザーを作成
    console.log('\nFirebase Authenticationにユーザーを作成中...');
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });
    console.log(`Authenticationユーザーが正常に作成されました。UID: ${userRecord.uid}`);

    // 2. Firestoreにユーザー情報を保存
    console.log('Firestoreにユーザー情報を保存中...');
    await db.collection('users').doc(userRecord.uid).set({
      username: username,
      email: email,
      role: selectedRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Firestoreへの保存が完了しました。');

    console.log('\n🎉 管理者アカウントの作成が成功しました！');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
  } finally {
    rl.close();
  }
};

// スクリプトを実行
createAdminUser();