import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import { User } from "../model/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

// not accesing webrequest , it is internal method so use just async
const generateAccessAndRefreshTokens =async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken =user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()

        user.refreshToken =refreshToken
        // mongose get kick , to hv password while save , but not required here 
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generate for refresh & access token")
    }
}

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
    const existedUser =await User.findOne({
        $or: [{ username },{ email }]
    })
    if (existedUser){
        throw new ApiError(409,"user with email or username existed")
    }
    const avatarLocalPath =req.files?.avatar[0]?.path;

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage >0 ){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatarlocal file is required")
    }
    // console.log(avatarLocalPath);
    const avatar =await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    // console.log(avatar);
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
     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new ApiError(500, "something went wrong while registered user")
     }
     return res.status(201).json(
        new ApiResponse(200,createdUser, "user reigster success")
     )
})


const loginUser = asyncHander( async(req,res) =>{
    // req body =>data
    //  username or email base login
    // find user
    // password check
    // access & refresh token
    //  send cookie for both


    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400,"user does not exist")
    }
    // User is mongodb object which has it own in built function
    //  user is our user having method we created like ispassword correct
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(400,"password is not valid")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    // refrence of user is empty so need to upadate databse or write query depend on optimization

    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")
    //  for cookies need to create option which are just object . secure & hhtp do not allow frontend to modify cookies and modiy just by server
    const options ={
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                // if user want to save  access & refresh token locally so need to share data though share cookie
                user: loggedInUser, accessToken,refreshToken
            },
            "User is loggend i Successfully"
        )
    )
})

const logoutUser = asyncHander(async(req,res)=>{ 
    // clear cookies & reset refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly: true,
        secure: true
    }
  
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {},"User logged Out"))
})

const refreshAccessToken =asyncHander(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken ||req.header("Authorization")?.replace("Bearer ","")

   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized incoming request")
   }

   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
     const user =await User.findById(decodedToken?._id)
     if(!user){
         throw new ApiError(401, "Invalid refresh token incoming")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "refresh toke is exprired or used")
     }
     
     const options ={
         httpOnly: true,
         secure: true
     }
 
     const {accessToken, newrefreshToken} =await generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken: newrefreshToken},
             "access token refresshed succuess"
         )
     )
   } catch (error) {
    throw new ApiError(401, "Invalid refresh token ")
   }
})

const changeCurrentPassword = asyncHander(async(req,res)=>{
    const  {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")
    }

    user.password = newPassword 
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {} ,"password changes succesfully"))
})

const getCurrentUser = asyncHander(async(req,res)=>{
    return res
    .status(200)
    .json(200, req.user,"current user fetched successfully")
})
// file upadate should be different controller
// text base update
const upadateAccount = asyncHander(async(req, res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All field are required")
    }
    // upadated information
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated succesfully"))
})

const updateUserAvatar =asyncHander(async(req,res)=>{
    const avatarLocalPath =req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar path file missing update")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading on avatr while update")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar Image upadates succefully"))
})

const updateUserCoverImage =asyncHander(async(req,res)=>{
    const coverImageLocalPath =req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image path file missing update")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading on cover image while update")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image upadates succefully"))
})
// challenge: one model data pass to another model
// challenge: sunscriber need user data along with number of subscribe and u are subscribe or not 

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    upadateAccount,
    updateUserAvatar,
    updateUserCoverImage
}