import express from "express";
import { registerUser ,activationUser, loginUser, logoutUser, updateAccessToken, spocialAuth, getSerInfo, updateUserInfo, updateUserPassword, updateCloudinaryPic, getAllUsers, updateUserRole, deleteUser} from "../controllers/usercontroller";
import {  authorizeRoles, isAuthenticated } from "../middleware/auth";

const userRouter=express.Router();

userRouter.post('/register',registerUser);
userRouter.post('/accout-activate',activationUser);
userRouter.post('/login',loginUser);
userRouter.get('/logout',isAuthenticated,logoutUser);
userRouter.get('/refresh',updateAccessToken);
userRouter.get('/me',isAuthenticated,getSerInfo);
userRouter.post('/socialAuth',spocialAuth);
userRouter.put('/update-user-info',isAuthenticated, updateUserInfo);
userRouter.put('/update-user-password',isAuthenticated, updateUserPassword);
userRouter.put('/update-user-avatar',isAuthenticated, updateCloudinaryPic);

userRouter.get('/all-users',isAuthenticated,authorizeRoles("admin"),getAllUsers);
userRouter.put('/update-user-role',isAuthenticated,authorizeRoles("admin"),updateUserRole);
userRouter.delete('/delet-user',isAuthenticated,authorizeRoles("admin"),deleteUser);








export  {userRouter};