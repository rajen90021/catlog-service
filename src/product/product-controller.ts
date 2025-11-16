import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { CloudinaryStorage } from "../common/services/cloudnary";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { Filter, Product, ProductEvents } from "./product-types";
import { MessageProducerBroker } from "../common/types/broker";
import { mapToObject } from "../utils";

export class ProductController {
    constructor(
        private productService: ProductService,
        private cloudinaryStorage: CloudinaryStorage,
        private broker: MessageProducerBroker,
    ) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return next(createHttpError(400, result.array()[0].msg));
            }

            const {
                name,
                description,
                priceConfiguration,
                attributes,
                tenantId,
                categoryId,
                isPublish,
            } = req.body;

            const imageFile = (req.files?.image as any) || null;

            let imageUrl = "";

            if (imageFile) {
                // Convert file buffer
                const fileData = {
                    fileData: imageFile.data, // express-fileupload gives buffer in .data
                    filename: imageFile.name,
                };

                // upload to Cloudinary (folder defined here)
                const uploadResponse = await this.cloudinaryStorage.upload(
                    fileData,
                    "products",
                );
                imageUrl = uploadResponse.secure_url;
            }

            const product = {
                name,
                description,
                priceConfiguration: JSON.parse(priceConfiguration),
                attributes: JSON.parse(attributes),
                tenantId,
                categoryId,
                isPublish,
                image: imageUrl || "default-image.jpg",
            };

            const response = await this.productService.createProduct(product as Product);
 // Send product to kafka.
        // todo: move topic name to the config

        await this.broker.sendMessage(
            "product",
            JSON.stringify({
                event_type: ProductEvents.PRODUCT_CREATE,
                data: {
                    id: response._id,
                    // todo: fix the typescript error
                    priceConfiguration: mapToObject(
                        response.priceConfiguration as unknown as Map<
                            string,
                            any
                        >,
                    ),
                },
            }),
        );

            res.status(201).json(response);
        } catch (error) {
            console.error("Product creation error:", error);
            next(createHttpError(500, "Error creating product"));
        }
    };



    update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(createHttpError(400, result.array()[0].msg as string));
    }

    const { productId } = req.params;

    const product = await this.productService.getProduct(productId);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Authorization: only Admin or same-tenant user
    const auth = (req as AuthRequest).auth;
    if (auth.role !== Roles.ADMIN && product.tenantId !== auth.tenant) {
      return next(createHttpError(403, "You are not allowed to access this product"));
    }

    let imageUrl = product.image; // keep current image as default

    // If new image provided → upload new one
    if (req.files?.image) {
      const imageFile = req.files.image as UploadedFile;

      // Upload new image to Cloudinary
        const uploadResponse = await this.cloudinaryStorage.upload(
            { fileData: imageFile.data as unknown as ArrayBuffer, filename: imageFile.name },
            "products"
        );

      imageUrl = uploadResponse.secure_url;

      // delete old image
      if (product.image && product.image.includes("cloudinary")) {
        await this.cloudinaryStorage.delete(product.image.split("/")[product.image.split("/").length - 1]);
      }
    }

    const {
      name,
      description,
      priceConfiguration,
      attributes,
      tenantId,
      categoryId,
      isPublish,
    } = req.body;

    const productToUpdate = {
      name,
      description,
      priceConfiguration: JSON.parse(priceConfiguration as string),
      attributes: JSON.parse(attributes as string),
      tenantId,
      categoryId,
      isPublish,
      image: imageUrl,
    };

    const updatedProduct = await this.productService.updateProduct(productId, productToUpdate as Product);

        // Send product to kafka.
        // todo: move topic name to the config
        await this.broker.sendMessage(
            "product",
            JSON.stringify({
                event_type: ProductEvents.PRODUCT_UPDATE,
                data: {
                    id: updatedProduct._id,
                    priceConfiguration: mapToObject(
                        updatedProduct.priceConfiguration as unknown as Map<
                            string,
                            any
                        >,
                    ),
                },
            }),
        );
    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    next(createHttpError(500, "Error updating product"));
  }
};


   index = async (req: Request, res: Response) => {
        const { q, tenantId, categoryId, isPublish } = req.query;

        const filters: Filter = {};

        if (isPublish === "true") {
            filters.isPublish = true;
        }

        if (tenantId) filters.tenantId = tenantId as string;

        if (
            categoryId &&
            mongoose.Types.ObjectId.isValid(categoryId as string)
        ) {
            filters.categoryId = new mongoose.Types.ObjectId(
                categoryId as string,
            );
        }

        // todo: add logging
        const products = await this.productService.getProducts(
            q as string,
            filters,
            {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : 10,
            },
        );

        const finalProducts = (products.data as Product[]).map(
            (product: Product) => {
                return {
                    ...product,
                    image: this.cloudinaryStorage.getObjectUri(product.image),
                };
            },
        );

        res.json({
            data: finalProducts,
            total: products.total,
            pageSize: (products as any).pageSize,
            currentPage: (products as any).currentPage,
        });
    };


  getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createHttpError(400, "Invalid product ID"));
    }

    const product = await this.productService.getProduct(productId);

    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Convert Mongoose document to plain object (prevents $__ and _doc issues)
    const plainProduct = product

    // Get Cloudinary accessible image URL
    plainProduct.image = this.cloudinaryStorage.getObjectUri(plainProduct.image);

    res.status(200).json(plainProduct);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    next(createHttpError(500, "Error fetching product"));
  }
};



deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createHttpError(400, "Invalid product ID"));
    }

    const product = await this.productService.getProduct(productId);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Authorization: only Admin or same-tenant user
    const auth = (req as AuthRequest).auth;
    if (auth.role !== Roles.ADMIN && product.tenantId !== auth.tenant) {
      return next(createHttpError(403, "You are not allowed to delete this product"));
    }

    // Delete image from Cloudinary if hosted there
    if (product.image && product.image.includes("cloudinary")) {
      try {
        const publicId = product.image.split("/").pop()?.split(".")[0]; // get last part before extension
        if (publicId) await this.cloudinaryStorage.delete(publicId);
      } catch (err) {
        console.warn("Cloudinary image deletion failed:", err);
      }
    }

    // Delete product from DB
    await this.productService.deleteProduct(productId);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    next(createHttpError(500, "Error deleting product"));
  }
};


}
