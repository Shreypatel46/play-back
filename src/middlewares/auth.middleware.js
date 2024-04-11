import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHander } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHander(async(req, res, next)=>{
    try {
        // for access token
       const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
       if(!token){
        throw new ApiError(401,"Unauthorized request for token")
       }
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if(!user){
        throw new ApiError(401,"Invalid access token")
       }
    
       req.user =user;
       next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token ")
    }
})