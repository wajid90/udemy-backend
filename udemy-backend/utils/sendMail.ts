import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path, { parse } from 'path';


interface EmailOptions {
    email: string;
    subject: string; 
    template: string;
    data:object;
}
export const userMail = async (options:EmailOptions)=>{


    const transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST as string,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE as string, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER, // generated ethereal user
            pass: process.env.SMTP_PASSWORD // generated ethereal password
        }
    });
    const html:string = await ejs.renderFile(path.join(__dirname,"../views/"+options.template+".ejs"),{data:options.data,email:options.email});

     const mailOptions={
        from:process.env.SMTP_USER,
        to:options.email,
        subject:options.subject,
        html:html
     }
  await transporter.sendMail(mailOptions);

}

export default userMail;