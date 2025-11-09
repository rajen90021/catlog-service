import mongoose from "mongoose";
import {
    Product,
    AttributeValue,
    ProductPriceConfiguration,
} from "./product-types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface AggregatePaginateModel<T> extends mongoose.Model<T> {
    aggregatePaginate: (
        aggregate: mongoose.Aggregate<any>,
        options: any,
    ) => Promise<any>;
}

const attributeValueSchema = new mongoose.Schema<AttributeValue>({
    name: {
        type: String,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
    },
});

const priceConfigurationSchema = new mongoose.Schema<ProductPriceConfiguration>(
    {
        priceType: {
            type: String,
            enum: ["base", "aditional"],
        },
        availableOptions: {
            type: Map,
            of: Number,
        },
    },
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        priceConfiguration: {
            type: Map,
            of: priceConfigurationSchema,
        },
        attributes: [attributeValueSchema],
        tenantId: {
            type: String,
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        isPublish: {
            type: Boolean,
            required: false,
            default: false,
        },
    } as any,
    { timestamps: true },
);
productSchema.plugin(aggregatePaginate);
export default mongoose.model<Product, AggregatePaginateModel<Product>>("Product", productSchema);
