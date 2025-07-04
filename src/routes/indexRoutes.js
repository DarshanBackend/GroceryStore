import express from "express";
import { upload, convertJfifToJpeg } from "../middlewares/imageupload.js";
import { isAdmin, isUser, UserAuth } from "../middlewares/auth.js";
import { registerAdmin, registerUser, getRegisterById, getAllUsers, updateProfileUser, updateProfileAdmin, VerifyPhone } from "../controllers/registerController.js";
import { changePassword, forgotPassword, adminLogin, resetPassword, VerifyEmail } from '../controllers/loginController.js';
import { createCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from "../controllers/categoryController.js";
import { createSubCategory, deleteSubCategory, getAllSubCategories, getSubCategoryById, updateSubCategory } from "../controllers/subCategoryController.js";
import { createbilling, deleteBillingAddress, getAllBillingAddress, getBillingAddressById, updateBillingAddress } from "../controllers/billingAddressController.js";

const indexRoutes = express.Router()

//Regitser Routes
indexRoutes.post("/registerAdmin", registerAdmin)
indexRoutes.post("/registerUser", registerUser)
indexRoutes.post('/verifyPhone', VerifyPhone);
indexRoutes.get("/getRegisterById/:id", UserAuth, getRegisterById)
indexRoutes.get("/getAllUsers", UserAuth, isAdmin, getAllUsers)
indexRoutes.put("/updateProfileAdmin/:id", UserAuth, isAdmin, upload.single("image"), convertJfifToJpeg, updateProfileAdmin)
indexRoutes.put("/updateProfileUser/:id", UserAuth, isUser, upload.single("image"), convertJfifToJpeg, updateProfileUser)

//login Routes
indexRoutes.post('/adminLogin', adminLogin);
indexRoutes.post('/forgotPassword', forgotPassword);
indexRoutes.post('/VerifyEmail', VerifyEmail);
indexRoutes.post('/resetPassword', resetPassword);
indexRoutes.post('/changePassword', UserAuth, changePassword);
// indexRoutes.post('/logoutUser', UserAuth, logoutUser);

// Category Routes (Admin or Manager)
indexRoutes.post("/createCategory", UserAuth, isAdmin, upload.single("category_image"), convertJfifToJpeg, createCategory);
indexRoutes.get("/getAllCategories", UserAuth, isAdmin, getAllCategories);
indexRoutes.get("/getCategoryById/:id", UserAuth, isAdmin, getCategoryById);
indexRoutes.put("/updateCategory/:id", UserAuth, isAdmin, upload.single("category_image"), convertJfifToJpeg, updateCategory);
indexRoutes.delete("/deleteCategory/:id", UserAuth, isAdmin, deleteCategory);

// Category Routes (Admin or Manager)
indexRoutes.post("/createSubCategory", UserAuth, isAdmin, upload.single("subCategory_image"), convertJfifToJpeg, createSubCategory);
indexRoutes.get("/getAllSubCategories", UserAuth, isAdmin, getAllSubCategories);
indexRoutes.get("/getSubCategoryById/:id", UserAuth, isAdmin, getSubCategoryById);
indexRoutes.put("/updateSubCategory/:id", UserAuth, isAdmin, upload.single("subCategory_image"), convertJfifToJpeg, updateSubCategory);
indexRoutes.delete("/deleteSubCategory/:id", UserAuth, isAdmin, deleteSubCategory);

//billingAddress Routes
indexRoutes.post("/createbilling", UserAuth, isUser, createbilling)
indexRoutes.get("/getBillingAddressById/:id", UserAuth, getBillingAddressById)
indexRoutes.get("/getAllBillingAddress", UserAuth, isAdmin, getAllBillingAddress)
indexRoutes.put("/updateBillingAddress/:id", UserAuth, isUser, updateBillingAddress)
indexRoutes.delete("/deleteBillingAddress/:id", UserAuth, isUser, deleteBillingAddress)




export default indexRoutes


