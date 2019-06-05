import { Router } from "express";

export class Endpoint {
    protected router: Router;
    protected mainPath: string = '';

    constructor() {
        this.router = Router();
    }

    public getRouter(): Router {
        return this.router;
    }

    public getMainPath(): string {
        return this.mainPath;
    }
}