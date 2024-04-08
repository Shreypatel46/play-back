import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import { User } from "../model/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHander( async ( req, res) =>{
    // get user details from frontend 
    // validation - non empty
    // check if user already exist: email, username
    // check for images, avatar (files)
    // upload them to cloudinary, avatar
    // create user object (mongo db required no sql data which is object ) - create in db
    // remove password and refresh token field from response
    //  check for user creation
    //  return res or error

    
    const {fullName, email, username,password}=req.body
    console.log("email: ", email);
    console.log("passwird:" ,password);

    if(
        [fullName, email, username,password].some((field) => field?.tirm ==="")
    ){
        throw new ApiError(400,"all field  is required")
    }
    const existedUser =User.findOne({
        $or: [{ username },{ email }]
    })
    if (existedUser){
        throw new ApiError(409,"user with email or username existed")
    }
    const avatarLocalPath =req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })
    //condition to user is created and  by default all r selected and -stirng used for remove 
     const createdUser = await User.findById(user._id)/Selection(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new ApiError(500, "something went wrong while registered user")
     }
     return res.status(201).json(
        new ApiResponse(200,createdUser, "user reigster success")
     )
})


export {registerUser}