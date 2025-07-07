import mongoose from "mongoose";

const unitSchema = mongoose.Schema({
    unit_name:{
        type:String
    },
    short_name:{
        type:String
    },
    status:{
        type:String,
        enum:["Active","Inactive"]
    }
}, { timestamps: true })

export default mongoose.model("Unit", unitSchema)
