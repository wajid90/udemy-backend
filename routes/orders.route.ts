import express from 'express';
import { isAuthenticated,authorizeRoles } from '../middleware/auth';
import { createOrder, getAllOrders } from '../controllers/order.controller';

const orderRoute=express.Router();

orderRoute.post('/create-order',isAuthenticated,createOrder);
orderRoute.get('/all-orders',isAuthenticated,authorizeRoles("admin"),getAllOrders);



export default orderRoute;