import * as express from 'express';
export interface LaunchpadConfig {
    version?: string;
    theme?: string;
    basePath?: string;
    appConfigPath?: string;
}
export declare class cds_launchpad_plugin {
    setup(options?: LaunchpadConfig): express.Router;
    prepareTemplate(options: LaunchpadConfig): Promise<string>;
    prepareAppConfigJSON(options: LaunchpadConfig): Promise<string>;
    addLinkToIndexHtml(service: any, apiPath: string): void;
}
//# sourceMappingURL=index.d.ts.map