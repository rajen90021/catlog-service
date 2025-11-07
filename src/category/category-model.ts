import mongoose from "mongoose";

interface PriceConfiguration {
    [key: string]: {
        priceType:'base' | 'additional';
        avilableOptions: string[];
    }
}

interface Attribute{
    name:string;
    widgetType:'switch' | 'radio' | 'select';
    defaultValue:string;
    avilableOptions:string[];
}

export interface Category {
    name: string;
    priceConfiguration: PriceConfiguration;
    attributes:Attribute[];
}


const priceConfigurationSchema = new mongoose.Schema<PriceConfiguration>({
    priceType:{
        type:String,
        enum:['base','additional'],
        required:true    
    },
    avilableOptions:{
        type:[String],
        required:true
    }

    
})


const attributeSchema = new mongoose.Schema<Attribute>({
    name:{
        type:String,
        required:true
    },
    widgetType:{
        type:String,
        enum:['switch','radio','select'],
        required:true
    },
    defaultValue:{
        type:mongoose.Schema.Types.Mixed,
        required:true
    },
    avilableOptions:{
        type:[String],
        required:true
    }
})

const categorySchema = new mongoose.Schema<Category>({
    
     name :{
        type:String,
        required:true
     },
     priceConfiguration:{
        type:Map,
        of:priceConfigurationSchema,
        required:true
     },
     attributes:{
        type:[attributeSchema],
        required:true
     }
     
     

});

export default mongoose.model('Category', categorySchema);