const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const saltRounds = 10;




exports.signUp = async (req, res) => {
    try {
        const { name, age, email, phno, gender, address, password } = req.body;

        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email was already exist!" });
        }

       
        const hashedPassword = await bcrypt.hash(password, saltRounds);

       
        const verificationToken = crypto.randomBytes(32).toString('hex');

       
        const user = new User({
            name,
            age,
            email,
            phno,
            gender,
            address,
            password: hashedPassword,
            role: 'client',
            verificationToken,
            isVerified: false,
        });

        await user.save();

        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'martmacatangay27@gmail.com',
                pass: 'sxiu jqsh buvl kksn',
            }
        });

        const verificationUrl = `http://localhost:3001/verify-email/${verificationToken}`;

        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Please verify your email address',
            text: `Click the link below to verify your email address:\n\n${verificationUrl}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Error sending email:", error);
            } else {
                console.log('Verification email sent: ' + info.response);
            }
        });

        console.log("User registered successfully");
        return res.redirect("/login");
    } catch (error) {
        console.error("Error in sign up", error);
        res.status(500).send("An error occurred during registration.");
    }
};


exports.verifyEmail = async (req, res) => {
    const { verificationToken } = req.params; 

    try {
        
        const user = await User.findOne({ verificationToken });

        if (!user) {
            return res.status(400).send("Invalid or expired verification token.");
        }

        
        user.isVerified = true;
        user.verificationToken = undefined; 
        await user.save();

        return res.send("Your email has been successfully verified! You can now log in.");
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).send("An error occurred during email verification.");
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("login", { errorMessage: "Invalid email or password." });
        }

        if (!user.isVerified) {
            return res.render("login", { errorMessage: "Please verify your email first." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { errorMessage: "Invalid email or password." });
        }

       
        req.session.user = { id: user._id, role: user.role, name: user.name, email: user.email };

        if (user.role === "admin") {
            return res.redirect("/admindashboard");
        } else if (user.role === "client") {
            return res.redirect("/clientdashboard");
        }
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", { errorMessage: "An error occurred during login." });
    }
};



exports.logout = (req, res) => {
    req.user = null;
    res.redirect('/');
};

// Password Reset Flow
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "No user found with this email." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'martmacatangay27@gmail.com',
                pass: 'sxiu jqsh buvl kksn',
            }
        });

        const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;

        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link below to reset your password:\n\n${resetUrl}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
            } else {
                console.log('Password reset email sent: ' + info.response);
            }
        });

        res.json({ message: "Password reset email sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "An error occurred while processing the password reset request." });
    }
};


// Reset Password Flow
exports.resetPassword = async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({ resetToken, resetTokenExpiry: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).send("Invalid or expired token.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.redirect("/login");
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).send("An error occurred during password reset.");
    }
};
// Display User Profile
exports.viewProfile = async (req, res) => {
    try {
        const userId = req.session.user.id; 
        const user = await User.findById(userId); 

        if (!user) {
            return res.status(404).send("User not found.");
        }

        
        res.render("userProfile", { user }); 
    } catch (error) {
        console.error("Error viewing profile:", error);
        res.status(500).send("An error occurred while fetching the user profile.");
    }
};
// Render Edit Address Form
exports.editAddressForm = async (req, res) => {
    const userId = req.session.user.id; 
    try {
        const user = await User.findById(userId); 

        if (!user) {
            return res.status(404).send("User not found.");
        }

        
        res.render("editAddressForm", { user }); 
    } catch (error) {
        console.error("Error fetching user for edit address form:", error);
        res.status(500).send("An error occurred while fetching user data.");
    }
};


// Process the Updated Address
exports.editAddress = async (req, res) => {
    const { userId } = req.body;
    const { address } = req.body;  

    try {
        const user = await User.findById(userId); 

        if (!user) {
            return res.status(404).send("User not found.");
        }
        
        user.address = address; 
        await user.save(); 

        res.redirect("/profile");
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).send("An error occurred while updating the address.");
    }
};
exports.viewOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "client") {
            console.log("User not authorized or not logged in.");
            return res.status(403).send("Access denied.");
        }

        console.log("Fetching orders for user:", req.user._id);

        
        const orders = await Order.find({ user: req.user._id }).populate("items.productId");

        console.log("Orders fetched:", orders);

        res.render("myOrders", {
            user: req.user,
            orders: orders,
        });
    } catch (err) {
        console.error("Error retrieving orders:", err);
        res.status(500).send("An error occurred while retrieving your orders.");
    }
};


exports.viewOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "client") {
            console.log("User not authorized or not logged in.");
            return res.status(403).send("Access denied.");
        }

        console.log("Fetching orders for user:", req.user._id);

       
        const orders = await Order.find({ user: req.user._id }).populate("items.productId");

        console.log("Orders fetched:", orders);

        res.render("myOrders", {
            user: req.user,
            orders: orders,
        });
    } catch (err) {
        console.error("Error retrieving orders:", err);
        res.status(500).send("An error occurred while retrieving your orders.");
    }
};
exports.viewOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "client") {
            console.log("User not authorized or not logged in.");
            return res.status(403).send("Access denied.");
        }

        console.log("Fetching orders for user:", req.user._id);

        
        const orders = await Order.find({ user: req.user._id }).populate("items.productId");

        console.log("Orders fetched:", orders);

        res.render("myOrders", {
            user: req.user,
            orders: orders,
        });
    } catch (err) {
        console.error("Error retrieving orders:", err);
        res.status(500).send("An error occurred while retrieving your orders.");
    }
};


















