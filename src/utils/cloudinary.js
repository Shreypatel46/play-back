import { v2  as cloudinary} from "cloudinary";
import fs from "fs";
// for image & videos storing and uploading 

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
//  whoever use these method pass the link
// make file and give link and  create method and give param and pass it on
const uploadOnCloudinary =async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
        //  upload file cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log("file upload on cloduniary",response.url);
        // fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) 
        // removinng the locally saved tempory file as the uplaod operation got failed
        return null;
    }
}

export {uploadOnCloudinary}