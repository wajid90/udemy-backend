import express from 'express';
import { addAnswer, addQuestion, addReplyToReview, addReview, editCourse, getAllCourse, getCourseByUser, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { isAuthenticated,authorizeRoles } from '../middleware/auth';

const router=express.Router();

router.post('/create-course',isAuthenticated,authorizeRoles('admin'),uploadCourse);
router.put('/update-course/:id',isAuthenticated,authorizeRoles('admin'),editCourse);
router.get('/get-course/:id',getSingleCourse);
router.get('/get-courses',getAllCourse);
router.get('/get-course-content/:id',isAuthenticated, getCourseByUser);
router.put('/add-question',isAuthenticated, addQuestion);
router.put('/add-answer',isAuthenticated, addAnswer);

/// review the course
router.put('/add-review/:id',isAuthenticated, addReview);
router.put('/add-reply-review',isAuthenticated,authorizeRoles("admin"), addReplyToReview);






export default router;

