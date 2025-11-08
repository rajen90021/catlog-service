import { NextFunction, Request,Response } from "express";
import { validationResult } from "express-validator";
import  createHttpError  from "http-errors";
import { Category } from "./category-types";
import { CategoryService } from "./category-service";
import { Logger } from "winston";
export class CategoryController {

    constructor(private categoryService:CategoryService ,private logger :Logger){
        this.create = this.create.bind(this)
    }
    


    async create(req:Request,res:Response,next:NextFunction){

            const result = validationResult(req)

            if(!result.isEmpty()){
                return  next(createHttpError(400,result.array()[0].msg))
            }

            

        try {

                const {name,priceConfiguration,attributes} = req.body as Category

                const category = await this.categoryService.createCategory({name,priceConfiguration,attributes})

                // this.logger.info(`Category created successfully: ${category.name}`)
                console.log(`Category created successfully: ${category.name}`)

            res.json({category})
        } catch (error) {
            next(error)
        }
    }
}
