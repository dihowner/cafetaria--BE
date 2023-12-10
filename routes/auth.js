import express from "express"
import AuthController from "../controllers/AuthController.js";
import UserController from "../controllers/UserController.js";
import ValidatorMiddleware from "../middleware/validator.js";

const router = express.Router();

router.post("/signup", ValidatorMiddleware.validateRequest(AuthController.validateCreateUser), AuthController.createUser);
router.post("/verify/account", ValidatorMiddleware.validateRequest(AuthController.validateVerifyToken), AuthController.verifyUserAccount);
router.post("/signin", ValidatorMiddleware.validateRequest(AuthController.validateLoginUser), AuthController.signIn);
router.post("/passwordreset/request", ValidatorMiddleware.validateRequest(AuthController.validatePasswordRequest), AuthController.passwordRequest)
router.post("/passwordreset/verify", ValidatorMiddleware.validateRequest(AuthController.validateVerifyReset), AuthController.verifyResetPasswordToken)
router.put("/passwordreset/change-password", ValidatorMiddleware.validateRequestActivity('password_reset', UserController.validateUpdateUser), AuthController.changePassword)

export default router