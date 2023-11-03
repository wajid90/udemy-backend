import mongoose from 'mongoose'
require('dotenv').config();

const dbUrl:string = process.env.DB_URL ||'';

export const connectDB=async ()=>{
      try{
          await mongoose.connect(dbUrl).then((data:any)=>{
            console.log(`Database Connected with ${data.connection.host}`)
          });
      }catch(error){
        setTimeout(connectDB,5000);

      }
}

