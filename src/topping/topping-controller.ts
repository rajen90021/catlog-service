import { NextFunction, Response, Request } from "express";
import { UploadedFile } from "express-fileupload";
import { FileStorage } from "../common/types/storage";
import { ToppingService } from "./topping-service";
import { CreataeRequestBody, Topping, ToppingEvents } from "./topping-types";
import { MessageProducerBroker } from "../common/types/broker";

export class ToppingController {
    constructor(
        private storage: FileStorage,
        private toppingService: ToppingService,
        // private broker?: MessageProducerBroker,
    ) {}

    create = async (
        req: Request<object, object, CreataeRequestBody>,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const image = req.files!.image as UploadedFile;
            // Upload to cloud storage in a dedicated folder
            const uploadResponse = await this.storage.upload(
                {
                    filename: image.name,
                    fileData: image.data as unknown as ArrayBuffer,
                },
                "toppings",
            );

            const imageUrl =
                (uploadResponse && (uploadResponse.secure_url || uploadResponse.url)) || "";

            // todo: add error handling
            const savedTopping = await this.toppingService.create({
                ...req.body,
                image: imageUrl,
                tenantId: req.body.tenantId,
            } as Topping);
            // todo: add logging

            // Send topping to kafka.
            // todo: move topic name to the config
            // if (this.broker) {
            //     await this.broker.sendMessage(
            //         "topping",
            //         JSON.stringify({
            //             event_type: ToppingEvents.TOPPING_CREATE,
            //             data: {
            //                 id: savedTopping._id,
            //                 price: savedTopping.price,
            //                 tenantId: savedTopping.tenantId,
            //             },
            //         }),
            //     );
            // }

            res.json({ id: savedTopping._id });
        } catch (err) {
            return next(err);
        }
    };

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const toppings = await this.toppingService.getAll(
                req.query.tenantId as string,
            );

            // todo: add error handling
            const readyToppings = toppings.map((topping) => {
                return {
                    id: topping._id,
                    name: topping.name,
                    price: topping.price,
                    tenantId: topping.tenantId,
                    image: topping.image,
                };
            });
            res.json(readyToppings);
        } catch (err) {
            return next(err);
        }
    };
}
