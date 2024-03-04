import express from "express";
import CartController from "../controllers/CartController.js";
import ValidatorMiddleware from "../middleware/validator.js";
import AuthMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post('/create', CartController.createCart)

router.delete('/:cartId/:mealSubMealId', CartController.deleteCart)

router.get('/verifycart-payment', CartController.verifyCartPayment);
router.get('/:cartId', CartController.getCart)

router.post('/checkout', AuthMiddleware.authenticateUserType('user'), ValidatorMiddleware.validateRequest(CartController.validateCheckOut), CartController.checkOutCart)

export default router