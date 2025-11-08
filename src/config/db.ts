import mongoose from "mongoose";
import config from "config";
export const initDb=  async() => {
 

    try {
        console.log(config.get("database.url"));
        await  mongoose.connect(config.get("database.url"));
        console.log("MongoDB connection successful");
    } catch (error) {
        console.log("MongoDB connection error", error);
    }
}