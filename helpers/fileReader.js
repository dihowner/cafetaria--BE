import filesystem from "fs"
import { InternalError } from "../helpers/errorHandler.js";

export const readFile = async (filePath) => {
    return await new Promise((resolve, reject) => {
        filesystem.readFile(filePath, "utf8", (error, content) => {
            if (error) {
                console.error(error);
                reject(new InternalError());
            } else {
                resolve(content);
            }
        });
    });
}