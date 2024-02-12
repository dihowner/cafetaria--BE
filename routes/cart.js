import express from "express";
import CartController from "../controllers/CartController.js";

const router = express.Router();

router.post('/create', CartController.createCart)

router.delete('/:cartId/:mealSubMealId', CartController.deleteCart)

router.get('/:cartId', CartController.getCart)

export default router