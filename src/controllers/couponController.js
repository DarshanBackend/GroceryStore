import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendBadRequestResponse, sendCreatedResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";
import Coupon from "../models/couponModel.js";
import path from "path";
import fs from "fs";
import { resolveMx } from "dns";

export const addCoupon = async (req, res) => {
    try {
        const { name, code, price, start_date, end_date } = req.body

        if (!name || !code || !price || !start_date || !end_date) {
            return sendBadRequestResponse(res, "all fields are required");
        }

        // Date format validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
        if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
            return sendBadRequestResponse(res, "Date format should be YYYY-MM-DD");
        }

        // Convert dates to Date objects for validation
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const currentDate = new Date();

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return sendBadRequestResponse(res, "Invalid date format");
        }

        // Check if start_date is not in the past
        if (startDate < currentDate) {
            return sendBadRequestResponse(res, "Start date cannot be in the past");
        }

        // Check if end_date is after start_date
        if (endDate <= startDate) {
            return sendBadRequestResponse(res, "End date must be after start date");
        }

        const existingCoupon = await Coupon.findOne({ $or: [{ name }, { code }] });
        if (existingCoupon) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendBadRequestResponse(res, "Coupon name and code are already registered.");
        }

        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/public/coupon_image/${req.file.filename}`;
        }

        const newCoupon = await Coupon.create({
            name,
            code,
            price,
            start_date: startDate,
            end_date: endDate,
            coupon_image: imagePath
        });

        return sendCreatedResponse(res, "Coupon created successfully", newCoupon);

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.find({})

        if (!coupon || coupon.length === 0) {
            return sendBadRequestResponse(res, "No Coupon found", [])
        }

        return sendSuccessResponse(res, "Coupon fetched successfully...", coupon)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getCouponById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Course Id")
        }

        const coupon = await Coupon.findById(id)

        if (!coupon) {
            return sendBadRequestResponse(res, "Coupon not found!!!")
        }

        return sendSuccessResponse(res, "Coupon fetched Successfully...", coupon)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Invalid Course Id")
        }

        const coupon = await Coupon.findById(id)

        if (!coupon) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return sendBadRequestResponse(res, "Coupon not found!!!")
        }
 
        if (req.file) {
            const oldImagePath = coupon.coupon_image;

            if (oldImagePath) {
                const absoluteOldImagePath = path.join(process.cwd(), oldImagePath);
                if (fs.existsSync(absoluteOldImagePath)) {
                    fs.unlinkSync(absoluteOldImagePath);
                }
            }
            // Set the new image path for the database.
            coupon.coupon_image = `/public/coupon_image/${req.file.filename}`;
        }

        // --- UPDATE OTHER FIELDS ---
        const { name, code, price, start_date, end_date, status } = req.body;
        if (name) coupon.name = name;
        if (code) coupon.code = code;
        if (price) coupon.price = price;
        if (start_date) coupon.start_date = start_date;
        if (end_date) coupon.end_date = end_date;
        if (status) coupon.status = status;

        await coupon.save()

        return sendSuccessResponse(res, "Coupon updated Successfully...", coupon)

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return ThrowError(res, 500, error.message)
    }
}

export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            return sendBadRequestResponse(res, "Invalid Coupon Id")
        }

        const coupon = await Coupon.findById(id)

        if (!coupon) {
            if (req.file && fs.existsSync(req.file.path)) {
                req.unlinkSync(req.file.path)
            }
            return sendBadRequestResponse(res, "Coupon not found!!!")
        }

        // Check if there is an image path stored.
        if (coupon.coupon_image) {
            // Construct the full, absolute path to the image file.
            const absoluteImagePath = path.join(process.cwd(), coupon.coupon_image);

            // Check if the file exists at that path and delete it.
            if (fs.existsSync(absoluteImagePath)) {
                fs.unlinkSync(absoluteImagePath);
            }
        }


        await Coupon.findByIdAndDelete(id)

        return sendSuccessResponse(res, "Coupon deleted Successfully..")

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return ThrowError(res, 500, error.message)
    }
}

