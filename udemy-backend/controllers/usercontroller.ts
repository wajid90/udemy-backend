import { Request,Response,NextFunction } from "express";
import User,{IUser} from "../models/usermodel";
import ErrorHandler from "../utils/ErrorHandler";
import {catchAsyncError}  from "../middleware/catchAsyncError";
import jwt, { JwtPayload } from "jsonwebtoken";
import userMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
import cloudinary from 'cloudinary';
require('dotenv').config();



interface IRegistration{
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id:string,
        url:string
    }
};

const registerUser =catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  
   try{
    const {name,email,password,avatar} = req.body as IRegistration;
    
    
    const Alredyuser = await User.findOne({email: email});

    if(Alredyuser){
       return next(new ErrorHandler("User Alredy Exist",400));
    }
    

    const user = {name,email,password,avatar};
    const data:any=createActivationToken(user);
    try {
      await userMail({email:email, subject:"Active Your Account",template:"verificationCode",data:data});

     return res.status(200).json({
        success: true,
        message:`Please check your email ${email} to activate your account`,
        activationToken:data.token 
      });

  } catch (err:any) {
     next(new ErrorHandler(err.message, 400))
  }

   }catch(err:any){
    return next(new ErrorHandler(err.message,400));
   }
});



interface IActivationToken{
    token: string;
    activationCode: string;
}

export const createActivationToken = (user:any):IActivationToken=>{

   const activationCode = Math.floor(10000-Math.random()*9000).toString();

    
   const token=jwt.sign({user,activationCode}, process.env.ACTIVATION_TOKEN as any,{expiresIn:"5m"});
   return {
    token,
    activationCode
   }
};

interface IActivationRequest{
    activation_token:string;
    activation_code:string;
}
const activationUser = catchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
    try{
     const {activation_token,activation_code}=req.body as IActivationRequest;
     const reUser= jwt.verify(activation_token,process.env.ACTIVATION_TOKEN as any) as {user:IUser,activationCode:string};
    
     
     if(reUser.activationCode!==activation_code){
       return next(new ErrorHandler("Invalid activation Code",400));
     }
     const {name,email,password}=reUser.user;

     const user = await User.findOne({email: email});

     if(user){
        return next(new ErrorHandler("User Alredy Exist",400));
     }
     
     const newUser = new User({name,email,password});
     newUser.save();
     res.status(201).json({
        success: true,
        message:"User Created Successfully",
        user:newUser
     })
    }catch(e:any){
       next(new ErrorHandler(e.message,400));
    }
})

interface ILoginUser{
    email:string;
    password:string;
}

const loginUser = catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
      const {email,password}=req.body as ILoginUser;
      const user = await User.findOne({email: email});
      if(!user){
        return next(new ErrorHandler("User Not Exist",400));
      }
      const isMatch = await user.comparePassword(password);
      if(!isMatch){
        return next(new ErrorHandler("Invalid Password",400));
      }

      sendToken(user,200,res);
  }catch(e:any){
    return next(new ErrorHandler(e.message,400));
  }
});

const logoutUser=catchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
    try{
      res.cookie("accessToken","",{maxAge:1});
      res.cookie("refreshToken","",{maxAge:1});
      const userId=req.user?.id || '';
      redis.del(userId);
      res.status(200).json({
        success: true,
        message:"User Logged Out Successfully"
      })

    }catch(e:any){
        return next(new ErrorHandler(e.message,400));
    }
});

const updateAccessToken=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
   try{
      const refresh_token=req.cookies.refreshToken as string;
      const decode=jwt.verify(refresh_token,process.env.REFRESH_TOKEN as string) as JwtPayload;
      const message="Could not refresh token";
      if(!decode){
        return next(new ErrorHandler(message,400));
      }

      const session=await redis.get(decode.id as string);

      
      if(!session){
          return next(new ErrorHandler(message,400));
      }

      const user=JSON.parse(session);

      console.log(user);

      const accessToken=jwt.sign({id:user._id},process.env.ACCESS_TOKEN as string,{
        expiresIn:"5m"
      });

      const refreshToken=jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
        expiresIn:"3d"
      });

      res.cookie('accessToken', accessToken, accessTokenOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenOptions);
       
      req.user = user;
      res.status(200).json({
        status:"success",
        accessToken
      });
  

   }catch(e:any){
    return next(new ErrorHandler(e.message,400));
   }
});
// get ser Info 

const getSerInfo=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
      const userId=req.user?._id;
      
      const session=await getUserById(userId,res,next) as any;

      if(!session){
          return next(new ErrorHandler("Could not get user info",400));
      }
      const user=JSON.parse(session);
      res.status(200).json({
        status:"success",
        user
      });
   }catch(e:any){
    return next(new ErrorHandler(e.message,400));
   }
});

// get social auth 

interface ISocialAuth{
  email:string;
  name:string;
  avatar:string;
}
const spocialAuth=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
      try {
           const {email,name,avatar}=req.body as ISocialAuth;
           const user = await User.findOne({email: email});
           if(!user){
             const newUser = await User.create({email,name,avatar});
              sendToken(newUser,200,res);
           }else{
              sendToken(user,200,res);
           }

      } catch (error:any) {
          next(new ErrorHandler(error.message,400));
      }
})
interface IUpdateData{
  email:string;
  name:string;
}
const updateUserInfo=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
       const {name,email}=req.body as IUpdateData;
       const userId=req.user?._id;
       const user=await User.findById({_id:userId});

       if(email && user){
        const isEmailExist=await User.findOne({email:email});

        if(!isEmailExist){
          return next(new ErrorHandler("Email Already Exist ..",400));
        }
        user.email=email;
       }
       if(name && user){
        user.name=name;
       }
       await user?.save();

       await redis.set(userId,JSON.stringify(user));

       res.status(201).json({
        success: true,
        message:"User Updated Successfully",
        user
       });
    } catch (err:any) {
       next(new ErrorHandler(err.message,400));
    }
});

interface IUpdatePassword{
  oldPassword:string;
  newPassword:string;
}
const updateUserPassword = catchAsyncError(async(req:Request, res:Response,next:NextFunction) => {
     
  try {
       const {oldPassword,newPassword} = req.body as IUpdatePassword;

       if(!oldPassword && !newPassword){
              return next(new ErrorHandler("Please provide old password and new password",400));
       }
       const userId=req.user?._id;
       const user=await User.findById({_id:userId}).select("+password");

       if(user?.password===undefined){
            return next(new ErrorHandler("Invalid User ...",400));
       }
       const isPassword=await user.comparePassword(oldPassword);

       if(!isPassword){
        return next(new ErrorHandler("Invalid Old Password",400));
       }
       user.password=newPassword;

       await user?.save();

       await redis.set(userId,JSON.stringify(user));

       res.status(201).json({
        success: true,
        message:"Password Updated Successfully",
        user
       });
  } catch (err:any) {
       next(new ErrorHandler(err.message,400));

  }
});

/// this get an error header
const updateCloudinaryPic=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
       const {avatar}=req.body;
       const userId=req.user?._id;
       const user=await User.findById({_id:userId});
      if(avatar && user){
        if(user?.avatar?.public_id){
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
          const myCloud=await cloudinary.v2.uploader.upload(avatar,{
            folder:"avatars",
            width:150
        });
        user.avatar={
           public_id:myCloud.public_id,
           url:myCloud.secure_url
        };
         }else{
           const myCloud=await cloudinary.v2.uploader.upload(avatar,{
               folder:"avatars",
               width:150
           });
           user.avatar={
              public_id:myCloud.public_id,
              url:myCloud.secure_url
           };
         }
      }

      await user?.save();
      await redis.set(userId,JSON.stringify(user));
      res.status(201).json({
        success: true,
        message:"Avatar Updated Successfully",
        user
       });
  } catch (err:any) {
    next(new ErrorHandler(err.message,400));
  }
})
export {registerUser,activationUser,loginUser,logoutUser,updateCloudinaryPic,updateUserPassword,updateAccessToken,updateUserInfo,getSerInfo,spocialAuth};
