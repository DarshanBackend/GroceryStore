import PrivacyPolicy from "../models/privacyPolicyModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendBadRequestResponse, sendCreatedResponse, sendSuccessResponse, sendErrorResponse } from "../utils/ResponseUtils.js";
import mongoose from "mongoose";


export const createPrivacyPolicy = async (req, res) => {
    try {
        const { title, description } = req.body

        if (!title || !description) {
            return sendBadRequestResponse(res, "title and description are requires for privacyPolicy")
        }

        const newprivacyPolicy = new PrivacyPolicy({
            title,
            description
        })

        const savePrivacyPolicy = await newprivacyPolicy.save()

        return sendCreatedResponse(res, "PrivacyPolicy created successfully", savePrivacyPolicy);

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.find({});

        // Check if any categories were found
        if (!privacyPolicy || privacyPolicy.length === 0) {
            return sendSuccessResponse(res, "No PrivacyPolicy found", []);
        }

        return sendSuccessResponse(res, "PrivacyPolicy fetched successfully", privacyPolicy);
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getPrivacyPolicyById = async (req, res) => {
    try {
        const { id } = req.params


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy ID format");
        }

        const privacyPolicy = await PrivacyPolicy.findById(id)
        if (!privacyPolicy) {
            return sendErrorResponse(res, 404, "PrivacyPolicy not found");
        }

        return sendSuccessResponse(res, "PrivacyPolicy fetched successfully", privacyPolicy);

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy Id");
        }

        // Find the privacy policy by ID
        const privacyPolicy = await PrivacyPolicy.findById(id);
        if (!privacyPolicy) {
            return sendErrorResponse(res, 404, "Privacy Policy not found");
        }

        // Update fields
        Object.assign(privacyPolicy, req.body);
        await privacyPolicy.save();

        return sendSuccessResponse(res, "Privacy Policy updated successfully", privacyPolicy);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const deletePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid PrivacyPolicy Id")
        }

        const privacyPolicy = await PrivacyPolicy.findById(id)
        if (!privacyPolicy) {
            return sendErrorResponse(res, 404, "Privacy Policy not found")
        }

        await PrivacyPolicy.findByIdAndDelete(id);


        return sendSuccessResponse(res, "PrivacyPolicy deleted successfully");

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}