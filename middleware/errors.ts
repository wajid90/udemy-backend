import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  if (err.name === "CastError") {
    const message = `Resource Not Found ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  if (err.code === 11000) {
    const message = `Duplicate Id ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token Error ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  if (err.name === "tokenDuplicateError") {
    const message = "Duplicate token  error,try again later";
    err = new ErrorHandler(message, 400);
  }
  res.status(err.statusCode).json({ success: false, error: err.message });
};

export default  errorMiddleware;


