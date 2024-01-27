import * as express from 'express';
export interface LaunchpadConfig {
    version?: string;
    theme?: string;
    basePath?: string;
    appConfigPath?: string;
    locale?: string;
    template?: string;
}
export declare class cds_launchpad_plugin {
    setup(): express.Router;
    prepareTemplate(options: LaunchpadConfig): Promise<string>;
    getAppsFromDependencies(packagejson: any): {
        appDirs: any[];
        cwd: string;
        depsPaths: any[];
    };
    prepareAppConfigJSON(options: LaunchpadConfig): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map