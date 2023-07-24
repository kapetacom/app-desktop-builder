type TypeModules = { [key: string]: any };

export interface KapetaBrowserAPI {
    paths: string[];
    config: any;
    resourceTypes: TypeModules;
    blockTypes: TypeModules;
    languageTargets: TypeModules;
    deploymentTargets: TypeModules;
    setPluginPaths: (paths: string[]) => void;
}
// @ts-ignore
const kapeta: KapetaBrowserAPI = window.Kapeta;

export default kapeta;
