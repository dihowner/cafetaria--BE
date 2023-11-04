import express from "express"
import * as AuthService from "../services/AuthService.js";

const router = express.Router();

router.get("/", (request, response) => {
  response.json({message: "Welcome to cafeteria"});
});

router.post("/add-user", AuthService.createUser);

export default router