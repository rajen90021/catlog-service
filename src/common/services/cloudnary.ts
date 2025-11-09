import { FileData, FileStorage } from "../types/storage";
import { v2 as cloudinary } from "cloudinary";
import config from "config";

export class CloudinaryStorage implements FileStorage {
    private client = cloudinary;

    constructor() {
        this.client.config({
            cloud_name: config.get("cloudinary.cloud_name"),
            api_key: config.get("cloudinary.api_key"),
            api_secret: config.get("cloudinary.api_secret"),
        });
    }

    async upload(data: FileData, folder: string): Promise<any> {
        const buffer = Buffer.from(data.fileData);

        return new Promise((resolve, reject) => {
            const stream = this.client.uploader.upload_stream(
                { folder }, // folder passed from controller
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            stream.end(buffer);
        });
    }

    async delete(publicId: string): Promise<void> {
        await this.client.uploader.destroy(publicId);
    }

    getObjectUri(publicId: string): string {
        return this.client.url(publicId);
    }
}
