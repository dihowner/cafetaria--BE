import express from "express";
import * as UserService from "../services/UserService.js";
import { requireLoggedInUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/statistic/:userId", UserService.userStatistics);
router.post("/change-password", requireLoggedInUser, UserService.modifyPassword);
// router.get("/statistic", requireLoggedInUser,  UserService.userStatistics);

export default router;
