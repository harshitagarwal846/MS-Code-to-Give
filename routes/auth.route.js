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
  createAdmin,
  loginAdmin
} = require('../controllers/auth.controller');


router.post('/login',loginwithpassword);
router.post('/login_with_phone', loginWithPhoneOtp);
router.post('/register', createNewUser);

router.post('/verify', verifyPhoneOtp);

router.get('/me', checkAuth, fetchCurrentUser);

// router.get('/admin', checkAuth, checkAdmin, handleAdmin);

router.post('/admin/register',createAdmin);
router.post('/admin/login',loginAdmin);
module.exports = router;
