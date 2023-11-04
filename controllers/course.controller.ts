import { NextFunction,Request,Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/couse.service";
import CourseModel from "../models/courseModel";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import userMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";

// upload course

export const uploadCourse=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
     try {
          const data=req.body;
          const thumbnail=data.thumbnail;

          if(thumbnail){
            const myCloud=await cloudinary.v2.uploader.upload(thumbnail,{
                folder:"courses",
                width:150
            });
            data.thumbnail={
               public_id:myCloud.public_id,
               url:myCloud.secure_url
            };
          }
          createCourse(data,res,next);

     } catch (err:any) {
        next(new ErrorHandler(err.message,400));
     }
})

export const editCourse=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const data=req.body;
        const thumbnail=data.thumbnail;
        if(thumbnail){
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);
            const myCloud=await cloudinary.v2.uploader.upload(thumbnail,{
                folder:"courses",
                width:150
            });
            data.thumbnail={
               public_id:myCloud.public_id,
               url:myCloud.secure_url
            };
        }

        const courseId=req.params.id;

        const course=await CourseModel.findByIdAndUpdate(courseId,{
            $set:data
        },{new:true});

        res.status(200).json({
            success: true,
            message: "Course Updated Successfully",
            course: course,
        });
    } catch (err:any) {
        next(new ErrorHandler(err.message,400));
    }
});

export const getSingleCourse=catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const courseId=req.params.id;
        
        const isCashExist=await redis.get(courseId);

        if(isCashExist){
            const course=JSON.parse(isCashExist);
            res.status(200).json({
                success: true,
                course: course,
            });
        }else{
            const course=await CourseModel.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

            redis.set(courseId,JSON.stringify(course));
            res.status(200).json({
                success: true,
                course: course,
            });
        }
        
    } catch (err:any) {
        next(new ErrorHandler(err.message,400));
    }
})

export const getAllCourse=catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
      try {
        const isExistCash=await redis.get("allCourses");

        if(isExistCash)
        {
            const courses=JSON.parse(isExistCash);
            res.status(200).json({
                success: true,
                courses: courses,
            });
        }else{
            const courses=await CourseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            redis.set("allCourses",JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses: courses,
            });
        }
          
      } catch (err:any) {
         next(new ErrorHandler(err.message,400));
      }
});

export const getCourseByUser=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
     try {
        const userCoursesList=req?.user?.courses;
        const courseId=req.params.id;

        const isCashExist=userCoursesList?.find((courses:any)=> courses._id.toString()===courseId);
        
        if(!isCashExist){
           next(new ErrorHandler("you are not eligibale to access this course ...",400));
        }
        const course=await CourseModel.findById({_id:courseId});

        const content=course?.courseData;
        res.status(200).json({
            success: true,
            content,
        })
     } catch (err:any) {
        return next(new ErrorHandler(err.message,400));
     }
});

interface IAddQuestionData{
    question:string;
    courseId:string;
    contentId:string;
}
export const addQuestion=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
   try {
     const {question,courseId,contentId}=req.body as IAddQuestionData;
     const course=await CourseModel.findById(courseId);
     if(!mongoose.Types.ObjectId.isValid(contentId)){
        return next(new ErrorHandler("invalid contentId",400));
     }

     const courseContent=course?.courseData.find((item:any)=>item._id.equals(contentId));

     if(!courseContent){
        return next(new ErrorHandler("invalid contentId",400));
     }
     const newQuestion:any={
        user:req.user,
        question:question,
        questionReplies:[],
     }
     courseContent.questions.push(newQuestion);

     await NotificationModel.create({
        userId:req.user?._id,
        title:"New Question Recive",
        message: `You Have a new Question from ${courseContent?.title}`
    });


     redis.set(courseId,JSON.stringify(course));
     await course?.save();
     res.status(200).json({
        success: true,
        message: "Question Added Successfully",
     });
   } catch (err:any) {
     next(new ErrorHandler(err.message,400));
   }
});

interface IAddAnswerData{
    answer:string;
    courseId:string;
    contentId:string;
    questionId:string;
}

export const addAnswer=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
   try {
      const {answer,courseId,contentId,questionId}=req.body as IAddAnswerData;
      const course=await CourseModel.findById(courseId);
      if(!mongoose.Types.ObjectId.isValid(contentId)){
         return next(new ErrorHandler("invalid contentId",400));
      }
      const courseContent=course?.courseData.find((item:any)=>item._id.equals(contentId));
      if(!courseContent){
         return next(new ErrorHandler("invalid contentId",400));
      }
      const question=courseContent.questions.find((item:any)=>item._id.equals(questionId));
      if(!question){
         return next(new ErrorHandler("invalid questionId",400));
      }
      const newAnswer:any={
         user:req.user,
         answer:answer,
      }
      question?.questionReplies?.push(newAnswer);
      redis.set(courseId,JSON.stringify(course));
      await course?.save();

     
    if(req.user?._id===question.user._id){
        await NotificationModel.create({
            userId:req.user?._id,
            title:"New Question Reply Recived",
            message: `You Have a new Question from ${courseContent?.title}`
        });
          
    }else{
        const data={
            name:question.user.name,
            title:courseContent.title,
        }
        
        // const html =await ejs.renderFile(path.join(__dirname,"../views/verificationCode.ejs"),
        // data);
        
      try {
          await userMail({
              email:question.user.email,
              subject:"Question Reply",
              template:"question-reply",
               data
          });
      } catch (err: any) {
          return next(new ErrorHandler(err.message,400));
      }


    }

      res.status(200).json({
         success: true,
         message: "Answer Added Successfully",
      });
   } catch (err:any) {
     next(new ErrorHandler(err.message,400));
   }
})

/// add review 
interface IAddReviewData{
    review:string;
    rating:string;
    userId:string;
}

export const addReview=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {

    const userCourseList=req.user?.courses;
    const courseId=req.params.id;

    const checkExist=userCourseList?.some((course:any)=>course._id.toString()===courseId.toString());

    if(checkExist){
        return next(new ErrorHandler("you are not eligibale to access this course...",400));
    }
    const course=await CourseModel.findById(courseId);
    if(!course){
        return next(new ErrorHandler("invalid courseId",400));
    }
      const {review,rating}=req.body as IAddReviewData;
      
      const newReview:any={
        user:req.user,
        rating,
        comment:review
      }
   
      course?.reviews.push(newReview);

      let avg=0;
      course?.reviews.forEach((review:any)=>{
          avg+=review.rating;
      });

      if(course){
        course.ratings=avg/course.reviews.length;
      }
      redis.set(courseId,JSON.stringify(course));
      await course.save();

      const notification={
        title:"New Review Recived",
        Message: `${req.user?.name} has given a review in ${course?.name}`
      }

      /// notifications add

      res.status(201).json({
        success: true,
        message: "Review Added Successfully",
      })

  } catch (err:any) {
    next(new ErrorHandler(err.message,500));
  }
})

interface IAddReplyReviewData{
 comment:string;
 courseId:string;
 reviewId:string;
}
export const addReplyToReview=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
     try {
        const {comment,courseId,reviewId}=req.body as IAddReplyReviewData;
        const course=await CourseModel.findById(courseId);
        if(!course){
           return next(new ErrorHandler("invalid courseId",400));
        }
        const review=course?.reviews.find((item:any)=>item._id.equals(reviewId));
        if(!review){
           return next(new ErrorHandler("invalid reviewId",400));
        }
        const newReply:any={
           user:req.user,
           comment:comment,
        }
        if(!review.commentReplies){
            review.commentReplies=[];
        }
        review?.commentReplies?.push(newReply);

        await course?.save();
        redis.set(courseId,JSON.stringify(course));


        
        res.status(200).json({
           success: true,
           message: "Reply Added Successfully",
        });

     } catch (err:any) {
        next(new ErrorHandler(err.message,500));
     } 
});

export const getAllCourses=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        getAllCoursesService(res);
    } catch (err:any) {
     next(new ErrorHandler(err.message,400));
    }
})


// delete course

export const deleteCourse=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {courseId}=req.body;
        const course=await CourseModel.findById(courseId);
        if(!course){
           return next(new ErrorHandler("invalid courseId",400));
        }
        redis.del(courseId);
        await course?.deleteOne({_id:courseId});
        res.status(200).json({
           success: true,
           message: "Course Deleted Successfully",
        });
    }catch(err:any){
        next(new ErrorHandler(err.message,500));
    }
});