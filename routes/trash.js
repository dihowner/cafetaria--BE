import express from "express"
import TrashController from "../controllers/TrashController.js";
const router = express.Router();

router.get('/:modelName', TrashController.trashModel)

export default router