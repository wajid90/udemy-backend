import { Request,Response,NextFunction } from "express";

export const catchAsyncError = (isFunc:any) =>(req:Request, res:Response, next:NextFunction) => Promise.resolve(isFunc(req,res,next)).catch(next);

// export default func => (req:Request, res:Response, next:NextFunction) => Promise.resolve(func(req, res, next)).catch(next);