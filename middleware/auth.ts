import { Request,Response,NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt,{JwtPayload} from "jsonwebtoken";
import { redis } from "../utils/redis";

 const isAuthenticated=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{

    const access_token=req.cookies.accessToken;

    if(!access_token){
        return next(new ErrorHandler('please login In  to access this Resourse',400));
    } 
    const decode=jwt.verify(access_token,process.env.ACCESS_TOKEN as string) as JwtPayload
    
    if(!decode) {
        return next(new ErrorHandler("access token is not valid",400));
    }
    
    const user=await redis.get(decode.id);
    if(!user){
        return next(new ErrorHandler('User Not Exist',400));
    }
    req.user=JSON.parse(user);
    next();
});

// validate role

 const authorizeRoles=(...roles:string[])=>{
    return (req:Request, res:Response,next:NextFunction)=>{
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler("You are not authorized to access this resource",403));
        }
        next();
    }
}

export {isAuthenticated,authorizeRoles};