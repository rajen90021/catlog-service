import express from "express";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import createProductValidator from "./create-product-validator";
import { asyncWrapper } from "../common/utils/wrapper";
import { ProductController } from "./product-controller";
import { ProductService } from "./product-service";
import { CloudinaryStorage } from "../common/services/cloudnary";
import fileupload from "express-fileupload";
import updateProductValidator from "./update-product-validator";

const router = express.Router();

const productService = new ProductService();
const cloudinaryStorage = new CloudinaryStorage();
const productController = new ProductController(
    productService,
    cloudinaryStorage,
);

router.post(
    "/",
    authenticate,
    fileupload({
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
        abortOnLimit: true,

        limitHandler: (req, res, next) => {
            return res
                .status(413)
                .json({ message: "File size limit exceeded" });
        },
    }),
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    createProductValidator,
    asyncWrapper(productController.create),
);

router.put(
    "/:productId",
    authenticate,
    fileupload({
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
        abortOnLimit: true,

        limitHandler: (req, res, next) => {
            return res
                .status(413)
                .json({ message: "File size limit exceeded" });
        },
    }),
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    updateProductValidator,

    asyncWrapper(productController.update),
);
router.get("/", asyncWrapper(productController.index));
router.get("/:productId", asyncWrapper(productController.getProductById));
router.delete("/:productId", canAccess([Roles.ADMIN, Roles.MANAGER]),  asyncWrapper(productController.deleteProduct));
export default router;
