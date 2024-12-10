const mongoose = require("mongoose");
const Product = require("./Product"); // Assuming you have a Product model

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: { type: String },
            price: { type: Number },
            quantity: { type: Number },
        },
    ],
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 50 },
    createdAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Declined", "ShippedOut", "Delivered"],
        default: "Pending",
    },
});

// Hook to update stock after order status is set to "Delivered"
orderSchema.post("save", async function (doc) {
    if (doc.status === "Delivered") {
        // Loop through each item in the order
        for (const item of doc.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                // Reduce the stock by the quantity ordered
                product.stock -= item.quantity;
                await product.save(); // Save the updated product
            }
        }
    }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
