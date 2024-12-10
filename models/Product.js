const mongoose = require("mongoose");

// Define the Review schema
const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
    rating: { type: Number, min: 1, max: 5, required: true }, // Rating between 1 and 5
    message: { type: String, required: true }, // Feedback message
    createdAt: { type: Date, default: Date.now } // Timestamp
});

// Extend the Product schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    category: { type: String },
    stock: { type: Number, default: 0 },
    image: { data: Buffer, contentType: String },
    reviews: [reviewSchema] // Array of reviews
});

module.exports = mongoose.model("Product", productSchema);
