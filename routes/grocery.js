import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import UploadMiddleware from '../middleware/upload.js'
import GroceryController from '../controllers/GroceryCategory.js'

const router = express.Router();

router.post("/add", AuthMiddleware.authenticateUserType('vendor'), UploadMiddleware.uploadSingleImage('groceryImage', 'uploads/grocery/'), 
                         ValidatorMiddleware.validateRequest(GroceryController.validateGrocery), GroceryController.createGrocery
            );

router.put('/:groceryId', ValidatorMiddleware.validateObjectIds('groceryId'),
                        AuthMiddleware.authenticateUserType('vendor'), 
                        UploadMiddleware.uploadSingleImage('groceryImage', 'uploads/grocery/'),
                        ValidatorMiddleware.validateRequest(GroceryController.validateGrocery), GroceryController.updateGrocery);

router.delete("/:groceryId", ValidatorMiddleware.validateObjectIds('groceryId'), AuthMiddleware.authenticateUserType('vendor'), 
                            ValidatorMiddleware.validateRequest(GroceryController.validateDeleteGrocery), GroceryController.deleteGrocery);

router.get('/all', GroceryController.getAllGrocery)

router.get('/:groceryId', ValidatorMiddleware.validateObjectIds('groceryId'), GroceryController.getGrocery)

router.put('/:groceryId/activate', ValidatorMiddleware.validateObjectIds('groceryId'),
                        AuthMiddleware.authenticateUserType('vendor'), 
                        ValidatorMiddleware.validateRequest(GroceryController.validateAvailability), GroceryController.updateAvailability)
                        
export default router;
