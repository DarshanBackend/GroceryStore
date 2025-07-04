import mongoose from "mongoose";

const privacyPolicySchema = mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    }
}, { timestamps: true })

export default mongoose.model("PrivacyPolicy", privacyPolicySchema)