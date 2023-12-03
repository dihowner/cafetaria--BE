import express from "express"
import * as AuthService from "../services/AuthService.js";

const router = express.Router();

router.post("/signup", AuthService.createUser);
router.post("/verify/account", AuthService.verifyUserAccount);
router.post("/signin", AuthService.loginUser);
router.post("/passwordreset/request", AuthService.passwordRequest)
router.post("/passwordreset/verify", AuthService.verifyResetPasswordToken)
router.put("/passwordreset/change-password", AuthService.changePassword)

export default router