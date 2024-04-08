import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
//  how data will be pass 
app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())  
// cookieParser will allow to access browser cookie & perform crud on it

// routes import 
// (can give import name any if export is default)
import userRouter from './routes/user.routes.js'

//  router delcaration and include api and it version standard practice
app.use("/api/v1/users",userRouter)

export { app }