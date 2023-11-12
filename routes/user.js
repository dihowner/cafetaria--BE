import express from "express"
import * as UserService from "../services/UserService.js";
import {requireLoggedInUser} from "../middleware/auth.js"; 

const router = express.Router();

router.get("/statistic", requireLoggedInUser,  UserService.userStatistics);

export default router