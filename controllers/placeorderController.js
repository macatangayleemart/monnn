const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");

exports.placeOrder = async (req, res) => {
    try {
        const { userName, userEmail, userAddress } = req.body;
        console.log("Placing order for user:", userEmail);

        // Step 1: Fetch the cart from the database
        const cart = await Cart.findOne({ email: userEmail });
        if (!cart || cart.items.length === 0) {
            console.error("Cart is empty.");
            return res.status(400).send("Your cart is empty.");
        }

        const sessionCart = req.session.cart || [];
        console.log("Cart Items in Session:", sessionCart);

        // Step 2: Fetch user
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.error("User not found.");
            return res.status(404).send("User not found.");
        }

        // Step 3: Calculate total amount
        const shippingFee = 50;
        const totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0) + shippingFee;

        
        // Step 4: Create the order
        const order = await Order.create({
            user: user._id,
            email: user.email,
            items: cart.items, // Add all cart items to the order
            totalAmount,
            shippingFee,
        });

        console.log("Order created successfully:", order);

        // Step 5: Remove ordered products from the cart
        cart.items = []; // Clear the cart
        await cart.save();

        // Clear session cart
        req.session.cart = [];

        // Step 6: Send order confirmation email
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "martmacatangay27@gmail.com",
                pass: "sxiu jqsh buvl kksn",
            },
        });

        const mailOptions = {
            from: "martmacatangay27@gmail.com",
            to: userEmail,
            subject: "Order Confirmation",
            html: `
                <h2>Thank you for your order!</h2>
                <p>Your order has been successfully placed. Here are the details:</p>
                <ul>
                    ${cart.items
                        .map(
                            (item) => `
                                <li>
                                    <strong>${item.name}</strong><br>
                                    Quantity: ${item.quantity}<br>
                                    Price: ₱${item.price.toFixed(2)}
                                </li>`
                        )
                        .join("")}
                </ul>
                <p><strong>Shipping Fee:</strong> ₱${shippingFee.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ₱${totalAmount.toFixed(2)}</p>
                <p>We will notify you once your order is shipped!</p>
                <br>
                <p>Thank you for shopping with us!</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Order confirmation email sent successfully!");

        // Step 7: Redirect back to the cart
        res.status(200).redirect("/cart");
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("An error occurred while placing the order.");
    }
};
exports.placeOrder2 = async (req, res) => {
    try {
        const { address, phone, paymentMethod } = req.body;

        // Get the items from the checkout session
        const checkoutItems = req.session.checkoutItems || [];
        if (checkoutItems.length === 0) {
            return res.status(400).send("No items to place an order.");
        }

        // Fetch the user from the session
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Calculate the total amount and shipping fee
        const shippingFee = 50; // PHP
        const totalAmount = checkoutItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        ) + shippingFee;

        // Create the order in the database
        const order = await Order.create({
            user: user._id,
            email: user.email,
            items: checkoutItems,
            shippingFee: shippingFee,
            totalAmount: totalAmount,
            shippingAddress: address,
            phone: phone,
            paymentMethod: paymentMethod,
            status: "Pending",
        });

        // Clear the session data (checkout items)
        req.session.checkoutItems = [];

        // Send a confirmation email to the user
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "martmacatangay27@gmail.com", // Use your email here
                pass: "sxiu jqsh buvl kksn", // Use an app password or OAuth2
            },
        });

        const mailOptions = {
            from: "martmacatangay27@gmail.com", // sender address
            to: user.email, // receiver address
            subject: "Order Confirmation",
            html: `
                <h2>Thank you for your order!</h2>
                <p>Your order has been placed successfully. Below are the details:</p>
                <ul>
                    ${checkoutItems
                        .map(
                            (item) => `
                            <li>
                                <strong>${item.name}</strong><br>
                                Quantity: ${item.quantity}<br>
                                Price: ₱${item.price.toFixed(2)}<br>
                                Subtotal: ₱${(item.price * item.quantity).toFixed(2)}
                            </li>`
                        )
                        .join("")}
                </ul>
                <p><strong>Shipping Fee:</strong> ₱${shippingFee.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ₱${totalAmount.toFixed(2)}</p>
                <p>We will notify you once your order is shipped!</p>
                <br>
                <p>Thank you for shopping with us!</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        // Redirect to the order confirmation page or my-orders
        res.status(200).redirect("/my-orders");

    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("An error occurred while placing the order.");
    }
};