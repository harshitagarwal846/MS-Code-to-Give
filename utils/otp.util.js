// const fast2sms = require("fast-two-sms");
var fast2sms = require('fast2sms');

const { FAST2SMS } = require('../config');

fast2sms.init({ FAST2SMS });

exports.generateOTP = (otp_length) => {
  // Declare a digits variable
  // which stores all digits
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

exports.fast2sms = async ({ message, contactNumber }, next) => {
  try {
    const res = await fast2sms.send({
      authorization: FAST2SMS,
      to: [contactNumber],
    });
    console.log(res);
  } catch (error) {
    next(error);
  }
};
