import { NextFunction, Request,Response } from "express";
import User from "../models/usermodel";
import { catchAsyncError } from "../middleware/catchAsyncError";
import { redis } from "../utils/redis";

export const getUserById=async(id:string,res:Response,next:NextFunction)=>{
      const userInfo= await redis.get(id);
      
      if(userInfo){
         const user=JSON.parse(userInfo);
         res.status(200).json({
            success: true,
            user
          });
      }  
};
