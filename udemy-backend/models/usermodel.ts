import mongoose, { Schema, Document, Model } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";


var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    role: string;
    isValidated: boolean;
    courses: Array<{ courseId: string }>
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken:()=>string;
    SignRefreshToken:()=>string;
};



const userSchema: Schema<IUser> = new mongoose.Schema({
    name: { type: String, required: [true, "Please Enter User Name"] },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: [true, 'Email address is required'],
        validate: {
            validator: function (email:string):boolean {
                return re.test(email)
            },
            message: 'Please fill a valid email address'
        }
        ,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "user"
    },
    isValidated: {
        type: Boolean,
        default: false
    },
    courses: [{ _id: String }],
},{timestamps: true});



userSchema.pre<IUser>('save',async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcryptjs.hash(this.password, 10);
});

userSchema.methods.SignAccessToken = function(){
    const accessToken =  jwt.sign(
        {
            id: this._id,
        },
        process.env.ACCESS_TOKEN as string,{
            expiresIn:"5m"
        }
    );
    return accessToken;
}

userSchema.methods.SignRefreshToken =  function(){
    const refreshToken =  jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN as string,{
            expiresIn:"3d"
        }
    );
    return refreshToken;
}   

userSchema.methods.comparePassword = async function (password:string) : Promise<boolean> {
    return await bcryptjs.compare(password, this.password);
};

const User: Model<IUser> = mongoose.model("User", userSchema);

export default User;