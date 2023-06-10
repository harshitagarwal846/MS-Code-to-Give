const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 name: {
   type: String,
   required: true
 },
 phoneNumber: {
   type: String,
   required: true
 },
 college: {
   type: String,
   required: true
 },
 gender: {
   type: String,
   enum: ['Male', 'Female', 'Other'],
   required: true
 },
 hasBeenToCounseling: {
   type: Boolean,
   required: true
 },
 hasBeenToRehabilitation: {
   type: Boolean,
   required: true
 },
 questionnaireId: {
   type: mongoose.Schema.Types.ObjectId,
   required: true
 },
 password: {
   type: String,
   required: true
 }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
