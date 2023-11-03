require('dotenv').config();
import {Response} from 'express';
import {IUser} from '../models/usermodel';
import { redis } from './redis';

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sareSite:'lax' | 'strict' | 'none' | undefined;
    secure: boolean;
}

export  const accessTokenExpiry=parseInt(process.env.ACCESS_TOKEN_EXPIRY || '300',10);
export const refreshTokenExpiry=parseInt(process.env.REFRESH_TOKEN_EXPIRY || '1200',10);

export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpiry *60*60*1000),
    maxAge: accessTokenExpiry * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sareSite: 'lax'
};

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpiry*24*60*60*1000),
    maxAge: refreshTokenExpiry*24*60*60*1000,
    httpOnly: true,
    secure: false,
    sareSite: 'lax'
};

export const sendToken=(user:IUser,statusCode:number,res:Response)=>{


    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    redis.set(user._id,JSON.stringify(user) as any);


    if(process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure=true;
    }
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        accessToken
    })
}