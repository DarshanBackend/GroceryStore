import mongoose from "mongoose";
import path from 'path';
import fs from 'fs';
import Category from "../models/categoryModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import {
    sendSuccessResponse,
    sendErrorResponse,
    sendBadRequestResponse,
    sendCreatedResponse
} from '../utils/ResponseUtils.js';

// Create a new category (admin only)
export const createCategory = async (req, res) => {
    try {
        const { category_name, status } = req.body;

        if (!category_name || !status) {
            return sendBadRequestResponse(res, "category_name and status are required");
        }

        const existingCategory = await Category.findOne({ $or: [{ category_name }, { status }] });
        if (existingCategory) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendBadRequestResponse(res, "category_name already registered for a Category.");
        }

        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/public/category_image/${req.file.filename}`;
        }

        const newCategory = await Category.create({
            category_name,
            status,
            category_image: imagePath
        });

        return sendCreatedResponse(res, "Category created successfully", newCategory);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});

        // Check if any categories were found
        if (!categories || categories.length === 0) {
            return sendSuccessResponse(res, "No categories found", []);
        }

        return sendSuccessResponse(res, "Categories fetched successfully", categories);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid category ID format");   
        }

        const category = await Category.findById(id);
        if (!category) {
            return sendErrorResponse(res, 404, "Category not found");
        }

        return sendSuccessResponse(res, "Category fetched successfully", category);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update a category (admin only)
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            // If ID is invalid and a file was uploaded, delete it.
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid Category ID format");
        }

        const category = await Category.findById(id);
        if (!category) {
            // If category not found and a file was uploaded, delete it.
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendErrorResponse(res, 404, "Category not found");
        }

        // --- LOGIC TO REPLACE OLD IMAGE ---
        if (req.file) {
            const oldImagePath = category.category_image; // Use the correct field name from your model

            if (oldImagePath) {
                const absoluteOldImagePath = path.join(process.cwd(), oldImagePath);
                if (fs.existsSync(absoluteOldImagePath)) {
                    fs.unlinkSync(absoluteOldImagePath);
                }
            }
            // Set the new image path for the database.
            category.category_image = `/public/category_image/${req.file.filename}`;
        }

        // --- UPDATE OTHER FIELDS ---
        const { category_name, status } = req.body;
        if (category_name) category.category_name = category_name;
        if (status) category.status = status;

        // Save all changes.
        await category.save();

        return sendSuccessResponse(res, "Category updated successfully", category);

    } catch (error) {
        // If any error occurs, clean up the newly uploaded file.
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return ThrowError(res, 500, error.message);
    }
};

// Delete a category (admin only)
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            // If ID is invalid and a file was uploaded, delete it.
            if (req.file && fs.existsSync(req.file.path)) {

                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid Category ID format");
        }


        // First, find the Category to get the image path before deleting the database record.
        const categoryToDelete = await Category.findById(id);

        if (!categoryToDelete) {
            return sendErrorResponse(res, 404, "Category not found");
        }

        // Check if there is an image path stored.
        if (categoryToDelete.category_image) {
            // Construct the full, absolute path to the image file.
            const absoluteImagePath = path.join(process.cwd(), categoryToDelete.category_image);

            // Check if the file exists at that path and delete it.
            if (fs.existsSync(absoluteImagePath)) {
                fs.unlinkSync(absoluteImagePath);
            }
        }

        // After handling the file, delete the category from the database.
        await Category.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Category deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}; 