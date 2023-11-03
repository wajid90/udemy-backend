import {app} from "./app";
import { connectDB } from "./utils/db";
import cloudinary from "cloudinary";
require("dotenv").config();




cloudinary.v2.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_SECRET_KEY
})


app.listen(process.env.PORT,()=>{
    console.log(`Server is running with port ${process.env.PORT}`);
    connectDB();
});

