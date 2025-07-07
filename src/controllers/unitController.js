import Unit from "../models/unitModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import mongoose from "mongoose";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const createUnit = async (req, res) => {
    try {
        const { unit_name, short_name, status } = req.body

        if (!unit_name || !short_name || !status) {
            return sendBadRequestResponse(res, "All field are required!!!")
        }

        const existingUnit = await Unit.find({
            $or: [
                { unit_name: unit_name, },
                { short_name: short_name }
            ]
        })

        if (existingUnit.length > 0) {
            return sendBadRequestResponse(res, "This Unit already exist!!!")
        }

        const newUnit = new Unit({
            unit_name,
            short_name,
            status
        })

        const saveUnit = await newUnit.save()

        return sendSuccessResponse(res, "Unit create successfully..", saveUnit)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllUnit = async (req, res) => {
    try {
        const unit = await Unit.find()

        if (!unit || unit.length === 0) {
            return sendBadRequestResponse(res, "No Unit found", [])
        }

        return sendSuccessResponse(res, "Unit fetched successfully...", unit)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getUnitById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Unit Id")
        }

        const unit = await Unit.findById(id)

        if (!unit) {
            return sendBadRequestResponse(res, "No Unit found")
        }

        return sendSuccessResponse(res, "Unit fetched successfully...", unit)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateUnit = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Unit Id")
        }

        const unit = await Unit.findById(id)

        if (!unit) {
            return sendBadRequestResponse(res, "No Unit found")
        }

        Object.assign(unit, req.body)
        await unit.save()

        return sendSuccessResponse(res, "Unit updated successfully", unit);
    } catch (error) {
        return ThrowError(res, 500, error.message)

    }
}

export const deleteUnit = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Unit Id")
        }

        const unit = await Unit.findById(id)

        if (!unit) {
            return sendBadRequestResponse(res, "No Unit found")
        }

        await Unit.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Unit deleted successfully");

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}