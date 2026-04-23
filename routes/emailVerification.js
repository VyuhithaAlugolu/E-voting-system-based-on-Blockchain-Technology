const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Adjust the path to your User model

// Generate a random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change to your email service provider
    auth: {
        user: 'your-email@gmail.com', // Your email
        pass: 'your-email-password', // Your email password
    },
});

// Route for sending OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();

    // Save OTP to the database associated with the user
    await User.updateOne({ email }, { otp, otpExpiry: Date.now() + 3600000 }); // OTP valid for 1 hour

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP for Email Verification',
        text: `Your OTP is ${otp}. It is valid for 1 hour.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending OTP', error });
        }
        res.status(200).json({ message: 'OTP sent successfully' });
    });
});

// Route for verifying OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    // Check if OTP is valid
    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid
    user.otp = undefined; // Clear OTP once verified
    user.otpExpiry = undefined; // Clear expiry
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
});

module.exports = router;