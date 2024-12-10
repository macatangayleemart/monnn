
const express = require("express");
const router = express.Router();
const { adminDashboard, addProduct, showAddProductForm, showEditProductForm, updateProduct, deleteProduct, upload, getProductImage, viewOrdersAdmin, updateOrderStatus  } = require("../controllers/adminController");
const { isAdmin } = require("../middleware/authMiddleware");



router.get("/product/image/:id", isAdmin, getProductImage);
router.post("/addproduct", upload.single("image"), isAdmin, addProduct);


router.get("/admindashboard", isAdmin, adminDashboard);


router.get("/addproduct", isAdmin, showAddProductForm);  


router.post("/addproduct", isAdmin, addProduct);  

router.get("/editproduct/:id", isAdmin, showEditProductForm);
router.post("/editproduct/:id", isAdmin, updateProduct);

router.post("/deleteproduct/:id", isAdmin, deleteProduct);

router.get("/orders", isAdmin, viewOrdersAdmin);
router.post("/update-order-status/:id", isAdmin, updateOrderStatus); 



module.exports = router;
