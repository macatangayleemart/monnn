
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const moment = require("moment"); 

module.exports.upload = upload;



exports.adminDashboard = async (req, res) => {
    if (req.user && req.user.role === "admin") {
        try {
            const products = await Product.find({});
            const orders = await Order.find({}).populate("user", "email");

            // Fetch today's delivered orders and calculate total sales
            const startOfDay = moment().startOf("day").toDate();
            const endOfDay = moment().endOf("day").toDate();

            const deliveredDailyOrders = await Order.find({
                status: "Delivered",
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            });

            const dailySales = deliveredDailyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            // Fetch weekly delivered orders and calculate total sales
            const startOfWeek = moment().startOf("week").toDate();
            const endOfWeek = moment().endOf("week").toDate();

            const deliveredWeeklyOrders = await Order.find({
                status: "Delivered",
                createdAt: { $gte: startOfWeek, $lte: endOfWeek },
            });

            const weeklySales = deliveredWeeklyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            // Fetch monthly delivered orders and calculate total sales
            const startOfMonth = moment().startOf("month").toDate();
            const endOfMonth = moment().endOf("month").toDate();

            const deliveredMonthlyOrders = await Order.find({
                status: "Delivered",
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            });

            const monthlySales = deliveredMonthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            res.render("admindashboard", {
                user: req.user,
                products: products,
                orders: orders,
                deliveredDailyOrders: deliveredDailyOrders,
                dailySales: dailySales,
                deliveredWeeklyOrders: deliveredWeeklyOrders,
                weeklySales: weeklySales,
                deliveredMonthlyOrders: deliveredMonthlyOrders,
                monthlySales: monthlySales,
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).send("An error occurred while fetching data.");
        }
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};




exports.addProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock } = req.body;

        if (req.file) {
            console.log("File received:", req.file);
        } else {
            console.log("No file uploaded.");
        }

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            stock,
            image: req.file
                ? { data: req.file.buffer, contentType: req.file.mimetype }
                : null
        });

        await newProduct.save();
        console.log("Product saved:", newProduct);
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("An error occurred while adding the product.");
    }
};

exports.getProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.image.data) {
            return res.status(404).send("Image not found.");
        }

        res.contentType(product.image.contentType);
        res.send(product.image.data);
    } catch (error) {
        console.error("Error fetching product image:", error);
        res.status(500).send("An error occurred while fetching the image.");
    }
};




exports.showAddProductForm = (req, res) => {
    if (req.user && req.user.role === "admin") {
        res.render("addproduct"); 
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};

exports.showEditProductForm = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.render("editproduct", { product });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send("An error occurred while fetching the product.");
    }
};

exports.updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, price, description, category, stock } = req.body;
    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { name, price, description, category, stock },
            { new: true }  
        );
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("An error occurred while updating the product.");
    }
};  



exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("An error occurred while deleting the product.");
    }
};

exports.viewOrdersAdmin = async (req, res) => {
    if (req.user && req.user.role === "admin") {
        try {
            
            const orders = await Order.find({}).populate("user");

            res.render("orders", {
                user: req.user, 
                orders: orders, 
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).send("An error occurred while fetching orders.");
        }
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 

    try {
        
        const allowedStatuses = ["Pending", "Accepted", "Declined", "ShippedOut", "Delivered"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).send("Invalid status.");
        }

        
        const order = await Order.findByIdAndUpdate(
            id,
            { status: status },
            { new: true } 
        );

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        console.log("Order status updated:", order);
        res.redirect("/orders"); 
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).send("An error occurred while updating the order status.");
    }
};


