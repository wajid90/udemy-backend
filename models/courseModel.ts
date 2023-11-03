import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./usermodel";

interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies?: IComment[];
}

interface IReviews extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}
interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  desciption: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  link: ILink[];
  suggestion: string;
  questions: IComment[];
}

interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benifits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReviews[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}
const reviewsSchema = new Schema<IReviews>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: Object,
  question: String,
  questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  title: String,
  videoSection: String,
  desciption: String,
  videoLength: Number,
  videoPlayer: String,
  link: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});
const courseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  estimatedPrice: {
    type: Number,
  },
  thumbnail: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  tags: {
    type:String,
    required:true
  },
  level: {
    type:String,
    required:true
  },
  demoUrl: {
    type:String,
    required:true
  },
  benifits:[{title:String}],
  prerequisites:[{title:String}],
  reviews: [reviewsSchema],
  courseData: [courseDataSchema],
  ratings:{
    type:Number,
    default:0
  },
  purchased:{
    type:Number,
    default:0
  },
});

const CourseModel:Model<ICourse>=mongoose.model("Course",courseSchema);

export default CourseModel;