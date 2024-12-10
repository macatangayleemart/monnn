    const User = require("../models/User");
    const Product = require("../models/Product");
    const Order = require("../models/Order");
    const Cart = require("../models/Cart");
    

    exports.clientdashboard = async (req, res) => {
        if (req.user && req.user.role === "client") {
            try {
               
                const products = await Product.find();
                
                
                const cartItems = req.session.cart || [];

                
                const cartProducts = await Product.find({ _id: { $in: cartItems } });

                
                res.render("clientdashboard", { 
                    user: req.user,
                    products: products,
                    cart: cartProducts  
                });
            } catch (err) {
                console.error(err);
                res.status(500).send("Error retrieving products.");
            }
        } else {
            res.status(403).send("Access denied. Clients only.");
        }
    };

    exports.addToCart = async (req, res) => {
        try {
            const productId = req.body.productId;
            const userEmail = req.user.email; // Assuming req.user contains the authenticated user's email
    
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send("Product not found.");
            }
    
            // Find or create the user's cart
            let cart = await Cart.findOne({ email: userEmail });
            if (!cart) {
                cart = new Cart({ email: userEmail, items: [] });
            }
    
            // Check if the product already exists in the cart
            const existingItem = cart.items.find(item => item.productId.toString() === productId);
    
            if (existingItem) {
                existingItem.quantity += 1; // Increment quantity if product already exists
            } else {
                // Add new product to the cart
                cart.items.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    image: product.image.data ? product.image.data.toString("base64") : product.image.url,
                });
            }
    
            // Save the cart to the database
            await cart.save();
    
            res.redirect("/clientdashboard");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error adding product to cart.");
        }
    };


    exports.getImage = async (req, res) => {
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


    exports.viewCart = async (req, res) => {
        try {
            const userEmail = req.user.email; // Assuming req.user contains the authenticated user's email
    
            // Retrieve the user's cart from the database
            const cart = await Cart.findOne({ email: userEmail });
    
            res.render("cart", {
                user: req.user,
                cart: cart ? cart.items : [], // Pass cart items or an empty array if no cart exists
            });
        } catch (err) {
            console.error("Error retrieving cart items:", err);
            res.status(500).send("An error occurred while retrieving your cart.");
        }
    };


   
    exports.removeFromCart = async (req, res) => {
        try {
            const { productId } = req.body;
            const email = req.user.email; // Assuming `req.user.email` contains the logged-in user's email
    
            // Find the user's cart
            const cart = await Cart.findOne({ email });
            if (!cart) {
                return res.status(404).send("Cart not found.");
            }
    
            // Filter out the product from the cart
            const initialItemCount = cart.items.length;
            cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    
            if (cart.items.length === initialItemCount) {
                return res.status(404).send("Product not found in cart.");
            }
    
            await cart.save();
    
            res.status(200).send({ message: "Item removed successfully." });
        } catch (err) {
            console.error("Error removing item from cart:", err);
            res.status(500).send("An error occurred while removing the item.");
        }
    };
    exports.searchProducts = async (req, res) => {
        try {
            const { query } = req.body;

           
            if (!query || query.trim() === "") {
                return res.redirect("/clientdashboard"); 
            }

           
            const products = await Product.find({
                $or: [
                    { name: { $regex: query, $options: "i" } }, 
                    { category: { $regex: query, $options: "i" } }
                ]
            });

            res.render("clientdashboard", { 
                user: req.user,
                products: products,
                cart: req.session.cart || [] 
            });
        } catch (err) {
            console.error("Error searching for products:", err);
            res.status(500).send("An error occurred while searching for products.");
        }
    };
    
    exports.checkout = async (req, res) => {
        try {
            let selectedItems = req.body.selectedItems; // Array of product IDs
            const userEmail = req.user.email;
    
            if (!selectedItems || selectedItems.length === 0) {
                return res.status(400).send("No items selected for checkout.");
            }
    
            selectedItems = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
    
            const cart = await Cart.findOne({ email: userEmail });
            if (!cart || cart.items.length === 0) {
                console.error("Cart not found or empty:", cart);
                return res.status(400).send("Your cart is empty.");
            }
    
            console.log("Cart Items from DB:", cart.items.map(item => item.productId.toString()));
            console.log("Selected Items from Request:", selectedItems);
    
            const selectedProducts = cart.items.filter(item =>
                selectedItems.includes(item.productId.toString())
            );
    
            console.log("Selected Products:", selectedProducts);
    
            if (selectedProducts.length === 0) {
                return res.status(400).send("Selected products are not in the cart.");
            }
    
            req.session.checkoutItems = selectedProducts;
            res.redirect("/order-summary");
        } catch (err) {
            console.error("Error during checkout:", err);
            res.status(500).send("An error occurred during checkout.");
        }
    };
    
    exports.orderSummary = async (req, res) => {
        try {
            const checkoutItems = req.session.checkoutItems || [];
            if (checkoutItems.length === 0) {
                return res.redirect("/viewCart");
            }

            
            const userId = req.session.user.id; 

            
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).send("User not found.");
            }

           
            const shippingFee = 50; // PHP
            const totalAmount = checkoutItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) + shippingFee;

           
            res.render("orderSummary", {
                userName: user.name,  
                userEmail: user.email,    
                userAddress: user.address,
                items: checkoutItems,
                shippingFee: shippingFee,
                totalAmount: totalAmount,
            });
        } catch (err) {
            console.error("Error rendering order summary:", err);
            res.status(500).send("An error occurred while rendering the order summary.");
        }
    };
    exports.viewClientOrders = async (req, res) => {
        try {
            const userEmail = req.user?.email || req.session?.user?.email;
    
            if (!userEmail) {
                return res.status(400).send("Email not found. Please ensure you're logged in.");
            }
    
            // Fetch orders excluding those with status "Delivered"
            const orders = await Order.find({ email: userEmail, status: { $ne: "Delivered" } }).sort({ createdAt: -1 });
    
            res.render("clientOrders", {
                orders: orders, // Pass filtered orders to the view
            });
        } catch (err) {
            console.error("Error fetching client orders:", err);
            res.status(500).send("An error occurred while retrieving your orders.");
        }
    };
    exports.viewDeliveredOrders = async (req, res) => {
        try {
            const userEmail = req.user?.email || req.session?.user?.email;
    
            if (!userEmail) {
                return res.status(400).send("Email not found. Please ensure you're logged in.");
            }
    
            
            const deliveredOrders = await Order.find({ email: userEmail, status: "Delivered" }).sort({ createdAt: -1 });
    
            res.render("orderHistory", {
                orders: deliveredOrders, 
            });
        } catch (err) {
            console.error("Error fetching delivered orders:", err);
            res.status(500).send("An error occurred while retrieving your delivered orders.");
        }
    };
    exports.viewProductDetails = async (req, res) => {
        try {
            const productId = req.params.id;
    
            // Fetch the product details from the database
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send("Product not found.");
            }
    
            res.render("productDetails", { 
                user: req.user, 
                product: product 
            });
        } catch (err) {
            console.error("Error fetching product details:", err);
            res.status(500).send("An error occurred while fetching product details.");
        }
    };
    exports.addReview = async (req, res) => {
        try {
          const productId = req.params.id;
          const { rating, message } = req.body;
      
          if (!req.user) {
            return res.status(401).send("You must be logged in to leave a review.");
          }
      
          const product = await Product.findById(productId);
          if (!product) {
            return res.status(404).send("Product not found.");
          }
      
          const existingReview = product.reviews.find(
            (review) => review.userId.toString() === req.user._id.toString()
          );
      
          if (existingReview) {
            return res.status(400).send("You have already reviewed this product.");
          }
      
          product.reviews.push({
            userId: req.user._id,
            rating,
            message,
          });
      
          await product.save();
      
          res.redirect(`/product/${productId}`); // Redirect to product details
        } catch (err) {
          console.error("Error adding review:", err);
          res.status(500).send("An error occurred while adding the review.");
        }
      };
      exports.getReviews = async (req, res) => {
        try {
          const productId = req.params.id;
      
          const product = await Product.findById(productId).populate("reviews.userId", "name");
          if (!product) {
            return res.status(404).send("Product not found.");
          }
      
          res.json(product.reviews); // Send reviews as JSON
        } catch (err) {
          console.error("Error fetching reviews:", err);
          res.status(500).send("An error occurred while fetching reviews.");
        }
      };
      exports.leaveFeedback = async (req, res) => {
        try {
            const { items } = req.body;
    
            // Iterate through each item and save the feedback
            for (const productId in items) {
                const feedback = items[productId];
                await Product.findByIdAndUpdate(
                    productId,
                    {
                        $push: {
                            reviews: {
                                userId: req.user._id,
                                rating: feedback.rating,
                                message: feedback.message,
                            }
                        }
                    }
                );
            }
    
            res.redirect("/order-history");
        } catch (err) {
            console.error("Error submitting feedback:", err);
            res.status(500).send("An error occurred while submitting feedback.");
        }
    };
    exports.renderEditQuantity = async (req, res) => {
        try {
            const productId = req.params.productId;
            const userEmail = req.user.email;
    
            // Find the cart of the user
            const cart = await Cart.findOne({ email: userEmail });
            if (!cart) return res.status(404).send("Cart not found.");
    
            // Find the specific item in the cart
            const item = cart.items.find(item => item.productId.toString() === productId);
            if (!item) return res.status(404).send("Item not found in cart.");
    
            // Render the editQuantity.ejs view
            res.render("editQuantity", { product: item, quantity: item.quantity });
        } catch (err) {
            console.error(err);
            res.status(500).send("Error rendering edit quantity page.");
        }
    };
    exports.updateQuantity = async (req, res) => {
        try {
            // Destructure productId and quantity from the request body
            const { productId, quantity } = req.body;
    
            // Ensure the quantity is valid
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: "Invalid quantity." });
            }
    
            // Find the cart by user's email (assuming user is authenticated and email is available)
            const cart = await Cart.findOne({ email: req.user.email });
    
            if (!cart) {
                return res.status(404).json({ message: "Cart not found." });
            }
    
            // Find the item in the cart by its productId
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
            if (itemIndex === -1) {
                return res.status(404).json({ message: "Product not found in cart." });
            }
    
            // Update the quantity of the item
            cart.items[itemIndex].quantity = quantity;
    
            // Save the updated cart
            await cart.save();
    
            // Redirect back to the cart page with the updated cart
            res.redirect("/cart");
        } catch (error) {
            console.error("Error updating cart quantity:", error);
            res.status(500).json({ message: "An error occurred while updating the cart." });
        }
    };
    exports.removeProduct = async (req, res) => {
        try {
            // Get the productId from the request body
            const { productId } = req.body;
    
            // Find the user's cart
            const cart = await Cart.findOne({ email: req.user.email });
    
            if (!cart) {
                return res.status(404).json({ message: "Cart not found." });
            }
    
            // Find the index of the product in the cart
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
            if (itemIndex === -1) {
                return res.status(404).json({ message: "Product not found in cart." });
            }
    
            // Remove the product from the cart
            cart.items.splice(itemIndex, 1);
    
            // Save the updated cart
            await cart.save();
    
            // Redirect to the cart page after removing the product
            res.redirect("/cart");
        } catch (error) {
            console.error("Error removing product from cart:", error);
            res.status(500).json({ message: "An error occurred while removing the product." });
        }
    };
    exports.buyNow = async (req, res) => {
        try {
            const { productId, quantity } = req.body;
    
            // Fetch product details
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send("Product not found.");
            }
    
            // Validate stock availability
            if (quantity > product.stock) {
                return res.status(400).send("Requested quantity exceeds available stock.");
            }
    
            // Prepare checkout data
            const checkoutItem = {
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: parseInt(quantity, 10),
            };
    
            // Store checkout item in session
            req.session.checkoutItems = [checkoutItem];
    
            // Redirect to the order summary page
            res.redirect("/order-summary2");
        } catch (err) {
            console.error("Error in Buy Now:", err);
            res.status(500).send("An error occurred during Buy Now.");
        }
    };
    exports.orderSummary2 = async (req, res) => {
        try {
            const checkoutItems = req.session.checkoutItems || [];
            if (checkoutItems.length === 0) {
                return res.redirect("/viewCart");
            }
    
            const userId = req.session.user.id;
            const user = await User.findById(userId);
    
            if (!user) {
                return res.status(404).send("User not found.");
            }
    
            const shippingFee = 50; // PHP
            const totalAmount = checkoutItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) + shippingFee;
    
            res.render("orderSummary2", {
                userName: user.name,
                userEmail: user.email,
                userAddress: user.address,
                items: checkoutItems,
                shippingFee: shippingFee,
                totalAmount: totalAmount,
            });
        } catch (err) {
            console.error("Error rendering order summary:", err);
            res.status(500).send("An error occurred while rendering the order summary.");
        }
    };
    
    exports.checkout2 = async (req, res) => {
        try {
            const { address, phone, paymentMethod } = req.body;
    
            // Get the checkout items from session (set in the "Buy Now" process)
            const checkoutItems = req.session.checkoutItems || [];
            const shippingFee = 50; // PHP
            const totalAmount = checkoutItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) + shippingFee;
    
            // Get the user email from the session
            const userEmail = req.session.user.email;
    
            // Create a new order in the database
            const order = await Order.create({
                user: req.session.user.id,
                email: userEmail, // Add the email here
                items: checkoutItems,
                shippingFee: shippingFee,
                totalAmount: totalAmount,
                shippingAddress: address,
                phone: phone,
                paymentMethod: paymentMethod,
                status: "Pending",
            });
    
            // Clear the checkout items in the session
            req.session.checkoutItems = [];
    
            // Redirect to a confirmation page or back to the cart
            res.redirect("/my-orders");
        } catch (err) {
            console.error("Error during checkout:", err);
            res.status(500).send("An error occurred during checkout.");
        }
    };
    
    
    