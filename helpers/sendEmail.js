import { config } from "../utility/config.js"
import { smtpTransporter } from "../mailer/smtp.js";
import mustache from 'mustache'
import { InternalError } from "./errorHandler.js";

const APPNAME = config.APP_NAME;

export const sendEmail = async (mailData, emailHtmlContent, mailParams) => {
    const transporter = await smtpTransporter();
    mailData.app_name = APPNAME
    const renderedHTML = mustache.render(emailHtmlContent, mailData);
    const mailOptions = {
        from: {
            name: `${APPNAME.toUpperCase()}`,
            address: mailParams.replyTo
        },
        to: mailParams.receiver,     // Receiver's email address
        subject: mailParams.subject,
        html: renderedHTML
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) throw new InternalError(''); 
        return true
    }); 
}