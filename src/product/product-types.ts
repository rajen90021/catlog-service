import mongoose, { Document } from "mongoose";

export interface AttributeValue {
    name: string;
    value: any;
}

export interface ProductPriceConfiguration {
    priceType: "base" | "aditional";
    availableOptions: Map<string, number>;
}

export interface Product extends Document{
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    priceConfiguration: Map<string, ProductPriceConfiguration>;
    attributes: AttributeValue[];
    tenantId: string;
    categoryId: mongoose.Types.ObjectId;
    isPublish: boolean;
    image: string;
}

export interface Filter {
    tenantId?: string;
    categoryId?: mongoose.Types.ObjectId;
    isPublish?: boolean;
}

export interface PaginateQuery {
    page: number;
    limit: number;
}

export enum ProductEvents {
    PRODUCT_CREATE = "PRODUCT_CREATE",
    PRODUCT_UPDATE = "PRODUCT_UPDATE",
    PRODUCT_DELETE = "PRODUCT_DELETE",
}


