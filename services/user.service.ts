import { NextFunction, Request,Response } from "express";
import User, { IUser } from "../models/usermodel";
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

export const getAllUsersService=async (res:Response)=>{
      const users=await User.find().sort({createdAt:-1});;
      res.status(200).json({
         success: true,
         users
      });
}

export const updateUserRoleService=async(id:any,role:any,res:Response)=>{
  const user=await User.findByIdAndUpdate(id,{role:role},{new:true});
  res.status(201).json({
    success: true,
    message:"User Role Updated Successfully",
    user
  });
};