const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    email: { type: String, required: true }, // Use email instead of user ID
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            image: { type: String }, // Store the image URL or base64
        },
    ],
    updatedAt: { type: Date, default: Date.now },
});

cartSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Cart", cartSchema);
