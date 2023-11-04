import { NextFunction ,Response,Request} from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthData } from "../utils/analytics.genrater";
import User from "../models/usermodel";
import CourseModel from "../models/courseModel";
import OrderModel from "../models/orderModel";





export const getUserAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const users=await generateLast12MonthData(User);

        res.status(200).json({
            success:true,
            users
        })
    } catch (err:any) {
         next(new ErrorHandler(err.message,500));
    }
});


export const getCourseAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const course=await generateLast12MonthData(CourseModel);

        res.status(200).json({
            success:true,
            course
        })
    } catch (err:any) {
         next(new ErrorHandler(err.message,500));
    }
});


export const getOrdersAnalytics=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const orders=await generateLast12MonthData(OrderModel);

        res.status(200).json({
            success:true,
            orders
        })
    } catch (err:any) {
         next(new ErrorHandler(err.message,500));
    }
});