import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


const userSchema =new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
        index: true, 
    },
    email:{
        type: String,
        required: true,
        lowecase: true,
        trim: true,
        index: true, 
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true, 
    },
    avatar:{
        type: String, //cloudinary url
        required: true,
    },
    coverImage:{
        type: String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, 'password is required']
    },
    refreshToken:{
        type: Stirng
    }
},{
    timestamps: true
})
// just used before middleware to save encryprt password
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password =bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function(){
    jwt.sign({
        _id:this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){}
export const User =mongoose.model("User", userSchema)