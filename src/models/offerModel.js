import mongoose from "mongoose";

const offerSchema = mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory"
    },
    offer_image: {
        type: String
    },
    offerName: {
        type: String
    },
    code: {
        type: String
    },
    discount: {
        type: Number
    },
    price: {
        type: Number
    },
    start_date: {
        typr: String
    },
    end_date: {
        typr: String
    },
    minimum_purchase: {
        type: Number
    },
    maximum_discount: {
        type: Number
    },
    offer_type: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String
    }

}, { timestamps: true })

export default mongoose.model("Offer", offerSchema)