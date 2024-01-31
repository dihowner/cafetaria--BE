import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import UploadMiddleware from "../middleware/upload.js";
import GroceryController from "../controllers/GroceryController.js";

const router = express.Router();

router.post('/add', AuthMiddleware.authenticateUserType('vendor'), UploadMiddleware.uploadSingleImage('groceryImage', 'uploads/grocery/'), 
                    ValidatorMiddleware.validateRequest(GroceryController.validateGrocery), GroceryController.createGrocery
                )

router.put('/:groceryId', ValidatorMiddleware.validateObjectIds('groceryId'),
                        AuthMiddleware.authenticateUserType('vendor'), 
                        UploadMiddleware.uploadSingleImage('groceryImage', 'uploads/grocery/'),
                        ValidatorMiddleware.validateRequest(GroceryController.validateGrocery), GroceryController.updateGrocery);
                        

router.put('/:groceryId/activate', ValidatorMiddleware.validateObjectIds('groceryId'), AuthMiddleware.authenticateUserType('vendor'), 
                            ValidatorMiddleware.validateRequest(GroceryController.validateAvailability), GroceryController.updateAvailability)

router.get('/all', GroceryController.getAllGrocery)

router.get('/:groceryId', ValidatorMiddleware.validateObjectIds('groceryId'), GroceryController.getGrocery)

router.delete("/:groceryId", ValidatorMiddleware.validateObjectIds('groceryId'), AuthMiddleware.authenticateUserType('vendor'), 
                            ValidatorMiddleware.validateRequest(GroceryController.validateDeleteGrocery), GroceryController.deleteGrocery);


export default router;
