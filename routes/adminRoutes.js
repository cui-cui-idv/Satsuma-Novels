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

module.exports = router;