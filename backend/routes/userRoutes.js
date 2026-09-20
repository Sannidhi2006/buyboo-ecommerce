'use strict';
const router = require('express').Router(); const { authMiddleware } = require('../middleware/authMiddleware'); const controller = require('../controllers/userController');
router.get('/me', authMiddleware, controller.getMe); router.put('/me', authMiddleware, controller.updateMe); router.put('/me/password', authMiddleware, controller.changePassword); router.delete('/me', authMiddleware, controller.deleteMe);
module.exports = router;
