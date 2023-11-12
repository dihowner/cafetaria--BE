import express from "express"
import * as AuthService from "../services/AuthService.js";

const router = express.Router();

router.post("/signup", AuthService.createUser);
router.post("/signin", AuthService.loginUser);

export default router