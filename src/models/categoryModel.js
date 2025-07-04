import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    category_image: {
        type: String
    },
    category_name: {
        type: String
    },
    status: {
        type: String,
        enum:["Active","Inactive"]
    }

}, { timestamps: true })

export default mongoose.model("Category", categorySchema)