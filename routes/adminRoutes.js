const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddleware');

// 全ての/adminルートはログインとadmin権限が必要
router.use('/admin', isAuthenticated, hasRole(['admin']));

// ユーザー管理ページを表示
router.get('/admin/users', adminController.showUsersPage);

// ユーザーの役割を更新
router.post('/admin/users/update-role', adminController.updateUserRole);

// ユーザーを削除
router.post('/admin/users/delete', adminController.deleteUser);

// 小説管理ページを表示
router.get('/admin/novels', adminController.showNovelsPage);

// 小説のステータスを更新
router.post('/admin/novels/update-status', adminController.updateNovelStatus);

// 小説を削除
router.post('/admin/novels/delete', adminController.deleteNovel);

// 管理者によるユーザー編集ページを表示
router.get('/admin/users/:id/edit', adminController.showUserEditPage);

// 管理者によるユーザー情報更新
router.post('/admin/users/:id/edit', adminController.updateUserByAdmin);

module.exports = router;