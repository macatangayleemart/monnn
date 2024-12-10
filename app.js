// app.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");

const clientRoutes = require("./routes/clientRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const placeorderRoutes = require("./routes/placeorderRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "your_secret_key", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
}));


app.use((req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user; 
    }
    next();
});


mongoose.connect('mongodb://localhost:27017/Database');
const db = mongoose.connection;
db.on('error', () => console.log("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.get("/", (req, res) => {
    res.redirect('landingpage');
});

// Use the routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(clientRoutes);
app.use(placeorderRoutes);

app.listen(3001, () => {
    console.log(`Server is running on http://localhost:3001`);
});
