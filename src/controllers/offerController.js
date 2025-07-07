import mongoose from "mongoose";
import fs from "fs"
import Offer from "../models/offerModel.js"
import Category from "../models/categoryModel.js";
import SubCategory from "../models/subCategoryModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendBadRequestResponse, sendSuccessResponse, sendCreatedResponse, sendErrorResponse } from "../utils/ResponseUtils.js";
import path from "path";

export const addOffer = async (req, res) => {
    try {
        const { categoryId, subCategoryId, offer_name, code, discount, price, start_date, end_date, minimum_purchase, maximum_discount, offer_type, description, status } = req.body;

        // Check required fields
        if (
            !categoryId || !subCategoryId || !offer_name || !code || !discount ||
            !price || !start_date || !end_date || !minimum_purchase ||
            !maximum_discount || !offer_type || !description || !status
        ) {
            return sendBadRequestResponse(res, "All fields are required");
        }

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid categoryId format");
        }
        if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid subCategoryId format");
        }

        // Check if category exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendErrorResponse(res, 404, "Category not found");
        }

        // Check if subcategory exists
        const subCategoryExists = await SubCategory.findById(subCategoryId);
        if (!subCategoryExists) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendErrorResponse(res, 404, "SubCategory not found");
        }


        const existingOffer = await Offer.findOne({ offer_name, categoryId });
        if (existingOffer) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendBadRequestResponse(res, "Offer already exists.");
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
            return sendBadRequestResponse(res, "Date format should be YYYY-MM-DD");
        }

        // Convert and validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const currentDate = new Date();
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return sendBadRequestResponse(res, "Invalid date format");
        }
        if (startDate < currentDate) {
            return sendBadRequestResponse(res, "Start date cannot be in the past");
        }
        if (endDate <= startDate) {
            return sendBadRequestResponse(res, "End date must be after start date");
        }

        // Handle image path
        let imagePath = null;
        if (req.file) {
            imagePath = `/public/offer_image/${req.file.filename}`;
        }

        // Create offer
        const newOffer = await Offer.create({
            categoryId,
            subCategoryId,
            offer_image: imagePath,
            offer_name: offer_name.trim(),
            code,
            discount,
            price,
            start_date,
            end_date,
            minimum_purchase,
            maximum_discount,
            offer_type,
            description,
            status
        });

        return sendCreatedResponse(res, "Offer created successfully", newOffer);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}

export const getAllOffer = async (req, res) => {
    try {
        const offer = await Offer.find({})

        if (!offer || offer.length === 0) {
            return sendBadRequestResponse(res, "No any Offer found!!!")
        }

        return sendSuccessResponse(res, "Offer fetched Successfully...", offer)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getOfferById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Offer Id")
        }

        const offer = await Offer.findById(id)

        if (!offer) {
            return sendBadRequestResponse(res, "No Any Offer found!!!")
        }

        return sendSuccessResponse(res, "Offer fetched Successfully...",offer)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateOffer = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            return sendBadRequestResponse(res, "Invalid Offer Id")
        }

        const offer = await Offer.findById(id)

        if (!offer) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            return sendBadRequestResponse(res, "Offer not found!!!")
        }

        if (req.file) {
            const oldImagePath = offer.offer_image

            if (oldImagePath) {
                const absoluteImagePath = path.join(process.cwd(), oldImagePath)
                if (fs.existsSync(absoluteImagePath)) {
                    fs.unlinkSync(absoluteImagePath)
                }
            }

            offer.offer_image = `/public/offer_image/${req.file.filename}`
        }

        const { categoryId, subCategoryId, offer_name, code, discont, price, start_date, end_date, minimum_purchase, maximum_discount, offer_type, description, status } = req.body

        if (offer_name) offer.offer_name = offer_name
        if (code) offer.code = code
        if (discont) offer.discont = discont
        if (price) offer.price = price
        if (start_date) offer.start_date = start_date
        if (end_date) offer.end_date = end_date
        if (minimum_purchase) offer.minimum_purchase = minimum_purchase
        if (maximum_discount) offer.maximum_discount = maximum_discount
        if (offer_type) offer.offer_type = offer_type
        if (description) offer.description = description
        if (status) offer.status = status
        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendBadRequestResponse(res, "Invalid categoryId format");
            }
            // Check if category exists
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendErrorResponse(res, 404, "Category not found");
            }
            offer.categoryId = new mongoose.Types.ObjectId(categoryId);
        }
        if (subCategoryId) {
            if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendBadRequestResponse(res, "Invalid subCategoryId format");
            }
            // Check if category exists
            const categoryExists = await Category.findById(subCategoryId);
            if (!categoryExists) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return sendErrorResponse(res, 404, "Category not found");
            }
            offer.subCategoryId = new mongoose.Types.ObjectId(subCategoryId);
        }

        await offer.save()

        return sendSuccessResponse(res, "Offer upadted Successfully...",offer)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendBadRequestResponse(res, "Invalid Offer ID format");
        }
        const offerToDelete = await Offer.findById(id);
        if (!offerToDelete) {
            return sendErrorResponse(res, 404, "Offer not found");
        }
        if (offerToDelete.offer_image) {
            const absoluteImagePath = path.join(process.cwd(), offerToDelete.offer_image);
            if (fs.existsSync(absoluteImagePath)) {
                fs.unlinkSync(absoluteImagePath);
            }
        }
        await Offer.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Offer deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
