 const User = require('../models/user.model');
const {
 PHONE_NOT_FOUND_ERR,
 PHONE_ALREADY_EXISTS_ERR,
 USER_NOT_FOUND_ERR,
 INCORRECT_OTP_ERR,
 ACCESS_DENIED_ERR,
} = require('../errors');
const { createJwtToken } = require('../utils/token.util');
const { generateOTP, fast2sms } = require('../utils/otp.util');

// --------------------- create new user ---------------------------------

exports.createNewUser = async (req, res, next) => {
 try {
   const {
     name,
     phoneNumber,
     college,
     gender,
     hasBeenToCounseling,
     hasBeenToRehabilitation,
     questionnaireId,
     password,
   } = req.body;

   // check duplicate phone number
   const phoneExist = await User.findOne({ phoneNumber });

   if (phoneExist) {
     next({ status: 400, message: PHONE_ALREADY_EXISTS_ERR });
     return;
   }

   // create new user
   const createUser = new User({
     name,
     phoneNumber,
     college,
     gender,
     hasBeenToCounseling,
     hasBeenToRehabilitation,
     questionnaireId,
     password,
   });

   // save user
   const user = await createUser.save();

   res.status(200).json({
     type: 'success',
     message: 'Account created, OTP sent to mobile number',
     data: {
       userId: user._id,
     },
   });

   // generate OTP
   const otp = generateOTP(6);
   // save OTP to user document
   user.phoneOtp = otp;
   await user.save();
   // send OTP to phone number
   await fast2sms(
     {
       message: `Your OTP is ${otp}`,
       contactNumber: user.phoneNumber,
     },
     next
   );
 } catch (error) {
   next(error);
 }
};

// ------------ login with phone OTP ----------------------------------

exports.loginWithPhoneOtp = async (req, res, next) => {
 try {
   const { phoneNumber } = req.body;
   const user = await User.findOne({ phoneNumber });

   if (!user) {
     next({ status: 400, message: PHONE_NOT_FOUND_ERR });
     return;
   }

   res.status(201).json({
     type: 'success',
     message: 'OTP sent to your registered phone number',
     data: {
       userId: user._id,
     },
   });

   // generate OTP
   const otp = generateOTP(6);
   // save OTP to user document
   user.phoneOtp = otp;
   user.isAccountVerified = true;
   await user.save();
   // send OTP to phone number
   await fast2sms(
     {
       message: `Your OTP is ${otp}`,
       contactNumber: user.phoneNumber,
     },
     next
   );
 } catch (error) {
   next(error);
 }
};

// ---------------------- verify phone OTP -------------------------

exports.verifyPhoneOtp = async (req, res, next) => {
 try {
   const { otp, userId } = req.body;
   const user = await User.findById(userId);
   if (!user) {
     next({ status: 400, message: USER_NOT_FOUND_ERR });
     return;
   }

   if (user.phoneOtp !== otp) {
     next({ status: 400, message: INCORRECT_OTP_ERR });
     return;
   }

   const token = createJwtToken({ userId: user._id });

   user.phoneOtp = '';
   await user.save();

   res.status(201).json({
     type: 'success',
     message: 'OTP verified successfully',
     data: {
       token,
       userId: user._id,
     },
   });
 } catch (error) {
   next(error);
 }
};

// --------------- fetch current user -------------------------

exports.fetchCurrentUser = async (req, res, next) => {
 try {
   const currentUser = res.locals.user;

   return res.status(200).json({
     type: 'success',
     message: 'Fetch current user',
     data: {
       user: currentUser,
     },
   });
 } catch (error) {
   next(error);
 }
};

// --------------- admin access only -------------------------

exports.handleAdmin = async (req, res, next) => {
 try {
   const currentUser = res.locals.user;

   return res.status(200).json({
     type: 'success',
     message: 'Okay, you are an admin!',
     data: {
       user: currentUser,
     },
   });
 } catch (error) {
   next(error);
 }
};
