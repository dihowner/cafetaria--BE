import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import RolesController from "../controllers/RolesController.js";
import ValidatorMiddleware from "../middleware/validator.js";

const router = express.Router();

router.get("/",  AuthMiddleware.authenticateUserType('admin'), RolesController.getRoles);
router.post("/add",  AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateRequest(RolesController.validateRole), RolesController.createRole);
router.put("/:id",  AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateObjectIds('id'),
                     ValidatorMiddleware.validateRequest(RolesController.validateRole), RolesController.updateRole);
router.get("/:id",  AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateObjectIds('id'), RolesController.getRole);
router.delete("/:id",  AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateObjectIds('id'), RolesController.deleteRole);
            
export default router;