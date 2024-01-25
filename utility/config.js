import dotenv from "dotenv";
const env = !process.env.NODE_ENV ? "development" : process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

export const config = {
  APP_NAME: process.env.APP_NAME,
  URL: `http://${process.env.HOST}:${process.env.PORT}`,
  FLW_CALLBACK_URL: `https://cafeteria-ekep.onrender.com/api/wallet/verify-payment`,
  // FLW_CALLBACK_URL: `http://${process.env.HOST}:${process.env.PORT}/api/wallet/verify-payment`,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FLW_SECRET: process.env.FLW_SECRET_KEY,
  APP_LOGO: "https://jamborow.co.uk/img/front/Logo.png",
  system_mail: {
    no_reply: 'no-reply@cafetaria.ng',
    support: 'support@cafetaria.ng'
  },
  OTP_EXPIRY_TIME:10, //Minutes
  SOCIAL_MEDIA_HANDLE: 'peaksystemsng',
  SAVE_FILE_ON_DISK: false
};
