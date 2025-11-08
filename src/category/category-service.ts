import { Category } from "./category-types";
import CategoryModel from "./category-model";

export class CategoryService {
    async createCategory(category:Category){

        const newCategory = new CategoryModel(category)
        return await newCategory.save()
        
    }
}
