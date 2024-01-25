import filesystem from 'fs'
import { config } from './config.js';
import cloudinary from './cloudinary.js';
import { InternalError } from '../helpers/errorHandler.js';

const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };

export const uniqueReference = function uniqueReference() {
  const currentDate = new Date();

  // Get individual date components
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");

  // Concatenate the components to form the desired format
  const todaysDateTime = `${year}${month}${day}${hours}${minutes}`;
  return todaysDateTime + generateRandomNumber(3)
  
}

export function generateRandomNumber(length = 6) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;

  let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

export function niceDateFormat(dateString) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);

  return formattedDate;
}

export function currentDate() {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('en-US', dateOptions);
  return formattedDate;
}

export function explodeString(stringData) {
    const explodedArray = stringData.split(" ");
    return explodedArray;
}

export function reformUploadPath(uploadPath) {
    return uploadPath.replace(/uploads[\\|\/]/, '');
}

export function removeUploadedFile(filePath) {
    return filesystem.unlinkSync(filePath);
}

export async function uploadToCloudinary(filePath, storagePath = 'uploads/') {
    let imagePath;
    // If save to local disk is disabled...
    if (!config.SAVE_FILE_ON_DISK) {
      try {
          // let upload it to cloudinary
          const uploadToCloudinary = await cloudinary.v2.uploader.upload(filePath, {folder: storagePath});
          console.log(uploadToCloudinary);
          imagePath = uploadToCloudinary.secure_url
          // Since we are not saving it to local Storage, let's remove the uploaded image asap...
          removeUploadedFile(filePath)
      } catch(error) {
        console.log(error);
        throw new InternalError(error)
      }
    } else {
        // remove "uploads/" folder name from the url if we are saving to disk...
        imagePath = reformUploadPath(filePath);
    }
    return imagePath;
}