import nodemailer from 'nodemailer';

export const smtpTransporter = async () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ogundowoleraheem@gmail.com',
            pass: 'uyxykbtrnesqlvmg'
        }
    })
}