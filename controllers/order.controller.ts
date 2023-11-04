import { NextFunction,Request,Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel,{IOrder} from "../models/orderModel";
import User from "../models/usermodel";
import CourseModel from "../models/courseModel";
import path from 'path';
import ejs from 'ejs';
import userMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";
import { redis } from "../utils/redis";
import { getAllOrdersService, newOrder } from "../services/order.service";

export const createOrder=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
     const {courseId,payment_info} = req.body as IOrder;
     const user =await User.findById(req.user?._id);

     const courseExistInUser=user?.courses.some((course:any)=> course._id.toString()===courseId);
    
     if(courseExistInUser){
        return next(new ErrorHandler("you have already purchase this course...",400));
     }
     const course=await CourseModel.findById(courseId);
     if(!course){
        return next(new ErrorHandler("Course Not Found ...",400));
     }
     const data:any={
        userId:user?._id,
        courseId:course._id,
        payment_info
     }
     const mailData={
        order:{
            _id:course._id.toString().slice(0,6),
            name:course.name,
            price:course.price,
            date:new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
        }
     }

     const html=await ejs.render(path.join(__dirname,"../views/order-confirmation.ejs"),mailData);
  
     try {
        if(user){
            await userMail({
                email:user?.email,
                subject:"Order Confirmation",
                template:"order-confirmation",
                data:mailData
            });
        }
        
     } catch (err:any) {
        next(new ErrorHandler(err.message,500));
     }
    user?.courses.push(course?._id);
    await user?.save();

    await NotificationModel.create({
        userId:req.user?._id,
        title:"new Order",
        message: `You Have a new Order from ${course?.name}`
    });

    course.purchased ? course.purchased+=1:course.purchased;
    await course.save();

    newOrder(data,res,next);

  } catch (err:any) {
      next(new ErrorHandler(err.message,500));
  }
});

export const getAllOrders=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        getAllOrdersService(res);
    } catch (err:any) {
     next(new ErrorHandler(err.message,400));
    }
})