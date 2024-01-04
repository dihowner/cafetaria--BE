import multer from "multer";
import httpStatusCode from 'http-status-codes'
import path from 'path';
import filesystem from 'fs'

export default class UploadMiddleware {
    static allowedExension = {
        image: ['.png', '.jpg', '.jpeg'],
        video: ['mp4', '.3gp'],
    }
    static allowedFileSize = 5 * 1024 * 1024;

    static fileUploader = (fieldName, destination = 'uploads', fileType) => {
        // Create the destination folder if it doesn't exist
        if (!filesystem.existsSync(destination)) {
            filesystem.mkdirSync(destination);
        }
        const storage = multer.diskStorage({
            destination: function (request, file, cb) {
                cb(null, destination);
            },
            filename: function (request, file, cb) {
                if(fileType.toLowerCase() == 'image') {
                    cb(null, Date.now() + '.png');
                } else {
                    cb(null, Date.now() + '.mp4');
                }
            }
        });
        
        const fileFilter = (request, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const allowedExtensions = this.getAllowedExensions(fileType)
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                request.errorMimeType = `Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`;
                cb(null, false);
            }
        };

        const upload = multer({ 
                storage: storage, 
                fileFilter: fileFilter, 
                limits: { fileSize: this.allowedFileSize, files: 1 } 
            }).single(fieldName);

        return (request, response, next) => {
            upload(request, response, function (error) {
                if (request.errorMimeType) {
                    // Invalid allowed extension.
                    return response.status(httpStatusCode.BAD_REQUEST).json({ message: request.errorMimeType });
                } else if (request.method.toUpperCase() == 'POST' && !request.file) {
                    return response.status(httpStatusCode.BAD_REQUEST).json({ message: 'Please select a valid file' });
                } else if (error instanceof multer.MulterError) {
                    if (error.code === 'LIMIT_FILE_SIZE') {
                        // File size exceeds the limit.
                        return response.status(httpStatusCode.BAD_REQUEST)
                                        .json({ message: `File size exceeds the limit of ${UploadMiddleware.allowedFileSize / (1024 * 1024)} MB.` });
                    }
                    // A Multer error occurred when uploading.
                    return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({ message: error.message });
                } else if (error) {
                    // An unknown error occurred when uploading.
                    return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Unknown error occurred' });
                }
                // Everything went fine.
                next();
            });
        };
    }

    static getAllowedExensions = (fileType) => {
        return this.allowedExension[fileType.toLowerCase()];
    }

    static uploadSingleImage = (fieldName, destination) => UploadMiddleware.fileUploader(fieldName, destination, 'image');
    static uploadSingleVideo = (fieldName, destination) => UploadMiddleware.fileUploader(fieldName, destination, 'video');

}