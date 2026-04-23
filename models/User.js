const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    otp: String,
    otpExpiry: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    walletVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;