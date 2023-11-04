import { Response } from "express";
import CourseModel from "../models/courseModel";
import { catchAsyncError } from "../middleware/catchAsyncError";

export const createCourse = catchAsyncError(async (data:any, res: Response) => {
    const course = await CourseModel.create(data);
    res.status(201).json({
        success: true,
        message: "Course Created Successfully",
        course: course,
    });
});

export const getAllCoursesService=async (res:Response)=>{
    const courses=await CourseModel.find().sort({createdAt:-1});
    res.status(200).json({
       success: true,
       courses
    });
}