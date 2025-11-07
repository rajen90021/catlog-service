import config from "config";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";

const app = express();

app.get("/", (req: Request, res: Response) => {
    res.json({ port: config.has("server.port") ? config.get<number>("server.port") : 5502 });
});

app.use(globalErrorHandler);

export default app;
