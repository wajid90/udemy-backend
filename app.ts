import express from "express";
import {NextFunction,Request,Response} from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import errorMiddleware from "./middleware/errors";
import {userRouter} from "./routes/userrouter";
import courseRoute from "./routes/course.route";
import orderRoute from "./routes/orders.route";
import notificationRoute from "./routes/notification.route";
import anlayticsRoute from "./routes/analytics.route";



export const app=express();

app.use(cookieParser());
app.use(
    cors({
        origin:process.env.ORIGIN,
        methods:[`GET`, `POST`, "DELETE","UPDATE"],
    })
);

app.use(express.json({'limit':"50mb"}));
app.use(express.urlencoded({limit:50,extended:true}));    
app.use("/api/v1",userRouter);
app.use("/api/v1",courseRoute);
app.use("/api/v1",orderRoute);
app.use("/api/v1",notificationRoute);
app.use("/api/v1",anlayticsRoute);








app.get("/test",(req:Request,res:Response,next:NextFunction)=>{
    res.status(200).json({
        success:true,
        message:"Api is running ...."
    })
});



app.all("*",(req:Request,res:Response,next:NextFunction)=>{
     const err=new Error(`Route ${req.originalUrl} not found`) as any;
     err.statusCode=404;
     next(err);
});

app.use(errorMiddleware);
