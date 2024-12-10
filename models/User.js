const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    phno: { type: String, required: true },
    gender: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    address: { type: String, required: true } 
});

const User = mongoose.model("User", userSchema);
module.exports = User;
