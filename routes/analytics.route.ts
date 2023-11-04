import express from 'express';
import { getCourseAnalytics, getOrdersAnalytics, getUserAnalytics } from '../controllers/analytics.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const anlayticsRoute=express.Router();

anlayticsRoute.get('/get-users-analytics',isAuthenticated,authorizeRoles("admin"), getUserAnalytics);
anlayticsRoute.get('/get-course-analytics',isAuthenticated,authorizeRoles("admin"), getCourseAnalytics);
anlayticsRoute.get('/get-orders-analytics',isAuthenticated,authorizeRoles("admin"), getOrdersAnalytics);

export default anlayticsRoute;
