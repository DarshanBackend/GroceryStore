import mongoose from "mongoose";

const couponSchema = mongoose.Schema({
    name: {
        type: String
    },
    code: {
        type: String
    },
    price: {
        type: String
    },
    coupon_image: {
        type: String
    },
    start_Date: {
        type: String
    },
    end_date: {
        type: String
    },
    status: {
        type: String
    }
}, { timestamps: true })

export default mongoose.model("Coupon", couponSchema)
