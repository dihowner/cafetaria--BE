import express from "express";
import OrderController from "../controllers/OrderController.js";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";


const router = express.Router();

router.get('/user/histories', AuthMiddleware.authenticateUserType('user'), OrderController.orderHistories)
router.get('/admin/histories', AuthMiddleware.authenticateUserType('admin'), OrderController.usersOrderHistories)
router.get('/vendor/histories', AuthMiddleware.authenticateUserType('vendor'), OrderController.vendorOrderHistories)
router.get('/:id', AuthMiddleware.requireLoggedInUser, ValidatorMiddleware.validateObjectIds('id'), OrderController.viewOrder)

export default router