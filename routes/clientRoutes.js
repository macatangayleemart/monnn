const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const router = express.Router();

// Route to show client dashboard
router.get("/clientdashboard", dashboardController.clientdashboard);

// Route to handle adding a product to the cart
router.post("/clientdashboard/add-to-cart", dashboardController.addToCart);
router.get("/clientdashboard/add-to-cart", dashboardController.addToCart);
router.get("/product/image/:id", dashboardController.getImage);  // this is fine
router.post("/remove-from-cart", dashboardController.removeFromCart);
router.get("/cart", dashboardController.viewCart);
router.get("/viewCart", dashboardController.viewCart);
router.post("/clientdashboard/search", dashboardController.searchProducts);
router.post("/checkout", dashboardController.checkout);
router.get("/order-summary", dashboardController.orderSummary);
router.get("/my-orders", dashboardController.viewClientOrders);
router.get("/order-history", dashboardController.viewDeliveredOrders);
router.get("/product/:id", dashboardController.viewProductDetails);
router.post("/product/:id/review", dashboardController.addReview); // Add a review
router.get("/product/:id/reviews", dashboardController.getReviews); // Fetch reviews
router.post("/leave-feedback", dashboardController.leaveFeedback);
router.get("/cart/edit-quantity/:productId", dashboardController.renderEditQuantity);
router.post("/cart/update-quantity", dashboardController.updateQuantity);
router.post("/cart/remove-product", dashboardController.removeProduct);
router.post("/clientdashboard/buy-now", dashboardController.buyNow);
router.get("/order-summary2", dashboardController.orderSummary2);

// Route to handle checkout
router.get("/checkout2", dashboardController.checkout2);
router.post("/checkout2", dashboardController.checkout2);

module.exports = router;
