import Register from "../models/registerModel.js";
import { ThrowError } from "../utils/ErrorUtils.js"
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from "path";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendForbiddenResponse, sendCreatedResponse, sendUnauthorizedResponse } from '../utils/ResponseUtils.js';
import twilio from 'twilio';

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const phoneNoOtp = async (contactNo, otp) => {
    let formattedContactNo = contactNo.toString().replace(/\D/g, '');
    if (formattedContactNo.length === 10) {
        formattedContactNo = `+91${formattedContactNo}`;
    } else if (formattedContactNo.length === 12 && formattedContactNo.startsWith('91')) {
        formattedContactNo = `+${formattedContactNo}`;
    } else {
        return ThrowError(res, 400, "Invalid contactNo format. Please provide a valid 10-digit Indian contactNo.");
    }
    // Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromPhone) {
    }
    const client = twilio(accountSid, authToken);
    try {
        await client.messages.create({
            body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
            to: formattedContactNo,
            from: fromPhone
        });
    } catch (twilioError) {
        console.log(`SMS sending failed: ${twilioError.message}`);
    }
}
// Admin Registration
export const registerAdmin = async (req, res) => {
    try {
        const { name, gender, email, contactNo, password } = req.body;
        if (!name || !gender || !email || !contactNo || !password) {
            return sendBadRequestResponse(res, "All fields (name, gender, email, contactNo, password) are required");
        }
        const existing = await Register.findOne({ $or: [{ email: email.toLowerCase() }, { contactNo }] });
        if (existing) {
            return sendBadRequestResponse(res, "Email or contactNo already registered");
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Register.create({
            name,
            gender,
            email: email.toLowerCase(),
            contactNo,
            password: hashedPassword,
            role: 'admin',
            isAdmin: true,
        });

        return sendCreatedResponse(res, "Admin registered..", { data: newAdmin });
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// User Registration
export const registerUser = async (req, res) => {
    try {
        const { contactNo } = req.body;
        if (!contactNo) {
            return sendBadRequestResponse(res, "contactNo is required");
        }
        const existing = await Register.findOne({ contactNo });
        if (existing) {
            existing.otp = generateOTP()
            existing.save()
            phoneNoOtp(existing.contactNo, existing.otp)
            return sendBadRequestResponse(res, "contactNo already registered");
        }

        const otp = generateOTP();
        const newUser = await Register.create({
            contactNo,
            role: 'user',
            isAdmin: false,
            otp,
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
        });
        phoneNoOtp(contactNo, otp)

        return sendCreatedResponse(res, "User registered. OTP sent.", { data: newUser });
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Verify Otp
export const VerifyPhone = async (req, res) => {
    try {
        const { contactNo, otp } = req.body;

        if (!contactNo || !otp) {
            return sendBadRequestResponse(res, "Please provide contactNo and OTP.");
        }

        const user = await Register.findOne({
            $or: [
                { contactNo: contactNo },
                { contactNo: '+91' + contactNo },
                { contactNo: Number(contactNo) }
            ]
        });
        if (!user) {
            return sendErrorResponse(res, 404, "User not found.");
        }

        if (!user.otp) {
            return sendBadRequestResponse(res, "No OTP found. Please request a new OTP.");
        }

        if (user.otp !== otp) {
            return sendBadRequestResponse(res, "Invalid OTP.");
        }

        user.otp = undefined;
        await user.save();

        const token = await user.getJWT();
        if (!token) {
            return sendErrorResponse(res, 500, "Failed to generate token");
        }
        return sendSuccessResponse(res, "OTP verified successfully.", { token: token });



    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get single register by ID
export const getRegisterById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists and has proper role
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }

        // Check if user is admin or accessing their own profile
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && req.user._id.toString() !== id) {
            return sendForbiddenResponse(res, "Access denied. You can only view your own profile.");
        }

        // Use findById for more robust lookup
        const register = await Register.findById(id);
        if (!register) {
            return sendErrorResponse(res, 404, "User not found");
        }

        // Prepare user response (exclude password)
        const userResponse = register.toObject();
        delete userResponse.password;

        return sendSuccessResponse(res, "User retrieved successfully", userResponse);
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

// Update profile only user
export const updateProfileUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contactNo, email, address } = req.body;
        // Only allow the authenticated user to update their own profile
        if (!req.user || req.user._id.toString() !== id) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
        }
        const existingUser = await Register.findById(id);
        if (!existingUser) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendErrorResponse(res, 404, "User not found");
        }
        // Handle image upload
        if (req.file) {
            const newImagePath = `/public/image/${path.basename(req.file.path)}`;
            if (existingUser.image && fs.existsSync(path.join(process.cwd(), existingUser.image))) {
                fs.unlinkSync(path.join(process.cwd(), existingUser.image));
            }
            existingUser.image = newImagePath;
        }
        // Update allowed fields
        if (name) existingUser.name = name;
        if (contactNo) existingUser.contactNo = contactNo;
        if (email) existingUser.email = email;
        if (address) existingUser.address = address; // Only if address exists in model
        await existingUser.save();
        const userResponse = existingUser.toObject();
        delete userResponse.password;
        return sendSuccessResponse(res, "User updated successfully", userResponse);
    } catch (error) {
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return ThrowError(res, 500, error.message);
    }
};

// Update profile only Admin
export const updateProfileAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, gender, email, contactNo } = req.body;
        // Only allow the authenticated admin to update their own profile
        if (!req.user || !req.user.isAdmin || req.user._id.toString() !== id) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendForbiddenResponse(res, "Access denied. Admins can only update their own profile.");
        }
        const existingAdmin = await Register.findById(id);
        if (!existingAdmin) {
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return sendErrorResponse(res, 404, "Admin not found");
        }
        // Handle image upload
        if (req.file) {
            const newImagePath = `/public/image/${path.basename(req.file.path)}`;
            if (existingAdmin.image && fs.existsSync(path.join(process.cwd(), existingAdmin.image))) {
                fs.unlinkSync(path.join(process.cwd(), existingAdmin.image));
            }
            existingAdmin.image = newImagePath;
        }
        // Update allowed fields
        if (name) existingAdmin.name = name;
        if (gender) existingAdmin.gender = gender;
        if (email) existingAdmin.email = email;
        if (contactNo) existingAdmin.contactNo = contactNo;
        await existingAdmin.save();
        const adminResponse = existingAdmin.toObject();
        delete adminResponse.password;
        return sendSuccessResponse(res, "Admin updated successfully", adminResponse);
    } catch (error) {
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return ThrowError(res, 500, error.message);
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        // Check if user is authenticated and is admin
        if (!req.user) {
            return sendUnauthorizedResponse(res, "Authentication required");
        }

        if (!req.user.isAdmin) {
            return sendForbiddenResponse(res, "Access denied. Only admins can view all users.");
        }

        // Find all users with role 'user'
        const users = await Register.find({ role: 'user' }).select('-password');

        // Check if any users were found
        if (!users || users.length === 0) {
            return sendSuccessResponse(res, "No users found", []);
        }

        // Send a success response with the fetched users
        return sendSuccessResponse(res, "Users fetched successfully", users);

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

