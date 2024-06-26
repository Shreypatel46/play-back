import mongoose, { Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new Schema({
    videoFile:{
        type: String, // cloudniary url
        required: true
    },
    thumbnail:{
        type: String, // cloudniary url
        required: true
    },
    title:{
        type: String, 
        required: true
    },
    desciption:{
        type: String, 
        required: true
    },
    duration:{
        type: Number, 
        required: true
    },
    views:{
        type:Number,
        default: 0
    },
    isPublish:{
        type:Boolean,
        default: true
    },
    owner:{
        tpye:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps: true
})
videoSchema.plugin(mongooseAggregatePaginate)
// can write aggreate query

export const Video = mongoose.model("Video",videoSchema)