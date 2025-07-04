import mongoose from "mongoose";

const subCategorySchema = mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ref"
    },
    subCategory_image: {
        type: String
    },
    subCategory_name: {
        type: String
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"]
    }

}, { timestamps: true })

export default mongoose.model("SubCategory", subCategorySchema)