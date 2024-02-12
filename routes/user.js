import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import UserController from "../controllers/UserController.js";
import ValidatorMiddleware from "../middleware/validator.js";
import UploadMiddleware from "../middleware/upload.js";

const router = express.Router();

router.get("/statistic/:userId", ValidatorMiddleware.validateObjectIds('userId'), UserController.userStatistics);

router.put("/change-password", AuthMiddleware.requireLoggedInUser, 
                    ValidatorMiddleware.validateRequestActivity('update_password', UserController.validateUpdateUser), 
                    UserController.modifyPassword
            );

router.put('/profile/update', AuthMiddleware.requireLoggedInUser, UploadMiddleware.uploadSingleImage('storeImage', 'uploads/stores/'),
                                ValidatorMiddleware.validateRequestActivity('update_profile', UserController.validateUpdateUser), UserController.updateProfile
            );
        
router.put("/modify-tx-pin", AuthMiddleware.authenticateUserType('vendor'), 
                    ValidatorMiddleware.validateRequestActivity('update_tx_pin', UserController.validateUpdateUser), 
                    UserController.modifyTxPin
            );
            
router.put("/set-bank", AuthMiddleware.authenticateUserType('vendor'), 
                    ValidatorMiddleware.validateRequestActivity('update_bank', UserController.validateUpdateUser), 
                    UserController.setUpBankAccount
            );
            
router.get("/details", AuthMiddleware.authenticateUserType('user'), UserController.getUser);
            
export default router;