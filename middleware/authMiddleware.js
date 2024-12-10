
const User = require("../models/User");
const bcrypt = require("bcrypt");

async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        if (!user.isVerified) {
            return res.status(403).send("Please verify your email.");
        }

        req.user = {
            id: user._id,
            role: user.role,
            isVerified: user.isVerified, // Ensure this is set
        };

        req.session.user = req.user; // Save to session
        return res.redirect("/clientdashboard");
    }

    res.status(401).send("Invalid email or password");
}

module.exports = {
    login,
};


function isAdmin(req, res, next) {
    console.log("Checking admin access. User data:", req.user); 
    if (req.user && req.user.role === 'admin') {
        return next(); 
    }
    return res.status(403).send("Access denied. Admins only."); 
}

module.exports = {
    isAdmin,
};

function isClient(req, res, next) {
    console.log("Checking admin access. User data:", req.user); 
    if (req.user && req.user.role === 'client') {
        return next();
    }
    return res.status(403).send("Access denied. Clients only.");
}
module.exports = {
    isClient,
};

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user; // Set req.user from session
        
        if (!req.user.isVerified) {
            return res.status(403).send("Please verify your email.");
        }

        return next(); // User is authenticated and verified, proceed
    }

    res.redirect('/login'); // Redirect to login if not authenticated
}


module.exports = {
    isClient,
    isAdmin,
    ensureAuthenticated,
};

