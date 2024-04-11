import { asyncHander } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import { User } from "../model/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    if(!username || email){
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


export {
    registerUser,
    loginUser,
    logoutUser
}