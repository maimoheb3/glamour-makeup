const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/users');
const { registerRules, loginRules, updateUserRules } = require('../validators/usersvalidators');
const { protect } = require('../middlewares/auth');

router.post('/register', registerRules, usersCtrl.createUser);
router.post('/login', loginRules, usersCtrl.login);
router.get('/', usersCtrl.getUsers);
router.get('/:id', usersCtrl.getUserById);
router.put('/:id', usersCtrl.updateUser);
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;
