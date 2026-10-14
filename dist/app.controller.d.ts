import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getStatus(): {
        name: string;
        status: string;
    };
}
