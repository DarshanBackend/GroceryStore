import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const registerSchema = mongoose.Schema({
    name: { type: String },
    gender: { type: String },
    contactNo: { type: Number },
    email: { type: String },
    address: { type: String },
    password: {
        type: String,
        validate: {
            validator: function (v) {
                // If role is admin, password is required
                if (this.role === 'admin') {
                    return typeof v === 'string' && v.length > 0;
                }
                // If role is user, password can be empty
                return true;
            },
            message: 'Password is required for admin registration.'
        }
    },
    image: { type: String },
    otp: { type: Number },
    otpExpiry: { type: Date },
    isAdmin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
}, { timestamps: true });

// Pre-save middleware to ensure isAdmin is in sync with role
registerSchema.pre('save', function (next) {
    this.isAdmin = this.role === 'admin';
    next();
});

//  JWT token create method
registerSchema.methods.getJWT = async function () {
    const user = this;
    const token = jwt.sign({
        _id: user._id,
        role: user.role || 'user',
        isAdmin: user.role === 'admin'
    }, process.env.JWT_SECRET);
    return token;
};

//  Password validation method
registerSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    return await bcrypt.compare(passwordInputByUser, user.password);
};

export default mongoose.model("register", registerSchema);