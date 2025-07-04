import mongoose from "mongoose";
import path from 'path';
import fs from 'fs';
import SubCategory from "../models/subCategoryModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import {
    sendSuccessResponse,
    sendErrorResponse,
    sendBadRequestResponse,
    sendCreatedResponse
} from '../utils/ResponseUtils.js';

// Create a new subcategory
export const createSubCategory = async (req, res) => {
    try {
        const { subCategory_name, status, categoryId } = req.body;

        if (!subCategory_name || !status || !categoryId) {
            return sendBadRequestResponse(res, "subCategory_name, status, and categoryId are required");
        }

        // Validate categoryId format
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid categoryId format");
        }

        // Check if category exists
        const Category = (await import("../models/categoryModel.js")).default;
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendErrorResponse(res, 404, "Category not found");
        }

        const existingSubCategory = await SubCategory.findOne({ subCategory_name, categoryId });
        if (existingSubCategory) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendBadRequestResponse(res, "SubCategory already exists for this category.");
        }

        let imagePath = null;
        if (req.file) {
            imagePath = `/public/subcategory_image/${req.file.filename}`;
        }

        const newSubCategory = await SubCategory.create({
            subCategory_name,
            status,
            categoryId,
            subCategory_image: imagePath
        });

        return sendCreatedResponse(res, "SubCategory created successfully", newSubCategory);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all subcategories
export const getAllSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({});
        if (!subCategories || subCategories.length === 0) {
            return sendSuccessResponse(res, "No subcategories found", []);
        }
        return sendSuccessResponse(res, "Subcategories fetched successfully", subCategories);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get a single subcategory by ID
export const getSubCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid subcategory ID format");
        }
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return sendErrorResponse(res, 404, "SubCategory not found");
        }
        return sendSuccessResponse(res, "SubCategory fetched successfully", subCategory);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update a subcategory
export const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid SubCategory ID format");
        }
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendErrorResponse(res, 404, "SubCategory not found");
        }
        if (req.file) {
            const oldImagePath = subCategory.subCategory_image;
            if (oldImagePath) {
                const absoluteOldImagePath = path.join(process.cwd(), oldImagePath);
                if (fs.existsSync(absoluteOldImagePath)) {
                    fs.unlinkSync(absoluteOldImagePath);
                }
            }
            subCategory.subCategory_image = `/public/subcategory_image/${req.file.filename}`;
        }
        const { subCategory_name, status, categoryId } = req.body;
        if (subCategory_name) subCategory.subCategory_name = subCategory_name;
        if (status) subCategory.status = status;
        if (categoryId) {
            // Validate categoryId format
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendBadRequestResponse(res, "Invalid categoryId format");
            }
            // Check if category exists
            const Category = (await import("../models/categoryModel.js")).default;
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendErrorResponse(res, 404, "Category not found");
            }
            subCategory.categoryId = categoryId;
        }
        await subCategory.save();
        return sendSuccessResponse(res, "SubCategory updated successfully", subCategory);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return ThrowError(res, 500, error.message);
    }
};

// Delete a subcategory
export const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid SubCategory ID format");
        }
        const subCategoryToDelete = await SubCategory.findById(id);
        if (!subCategoryToDelete) {
            return sendErrorResponse(res, 404, "SubCategory not found");
        }
        if (subCategoryToDelete.subCategory_image) {
            const absoluteImagePath = path.join(process.cwd(), subCategoryToDelete.subCategory_image);
            if (fs.existsSync(absoluteImagePath)) {
                fs.unlinkSync(absoluteImagePath);
            }
        }
        await SubCategory.findByIdAndDelete(id);
        return sendSuccessResponse(res, "SubCategory deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};