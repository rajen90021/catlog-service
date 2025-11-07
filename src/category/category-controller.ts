import { NextFunction, Request,Response } from "express";

export class CategoryController {
    


    async create(req:Request,res:Response,next:NextFunction){
        try {
            res.json({message:'Category created successfully'})
        } catch (error) {
            next(error)
        }
    }
}
