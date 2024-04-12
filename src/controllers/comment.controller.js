import mongoose from "mongoose";
import { Comment } from "../model/comment.model";
import { ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHander } from "../utils/asyncHandler.js";

const getVideoComments = asyncHander(async(req,res) => {
    // Todo: get all commetns for video
    const {videoId} = req.params
    const {page=1,limit=10} =req.query
})
const addComment = asyncHander(async(req,res)=>{
    // Todo 
})
const updateComment = asyncHander(async(req,res)=>{
    // Todo
})
const deleteComment = asyncHander(async(res,req)=>{

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
