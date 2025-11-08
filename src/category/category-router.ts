import express from "express";
import { CategoryController } from "./category-controller";
import categoryValidator from "./category-validator";
import { CategoryService } from "./category-service";
import { Logger } from "winston";
const router = express.Router();



const categoryService = new CategoryService();
const logger = new Logger();
const categoryController = new CategoryController(categoryService,logger);


router.post('/', categoryValidator, categoryController.create)




export default router;