const express = require('express');
const router = express.Router();

const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const {
  createNewUser,
  handleAdmin,
  loginWithPhoneOtp,
  fetchCurrentUser,
  verifyPhoneOtp,
  loginwithpassword,
} = require('../controllers/auth.controller');


router.post('/login',loginwithpassword);
router.post('/login_with_phone', loginWithPhoneOtp);
router.post('/register', createNewUser);

router.post('/verify', verifyPhoneOtp);

router.get('/me', checkAuth, fetchCurrentUser);

router.get('/admin', checkAuth, checkAdmin, handleAdmin);

module.exports = router;
