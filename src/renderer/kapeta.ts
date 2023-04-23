type TypeModules = { [key: string]: any };

export interface KapetaAPI {
    paths: string[];
    config: any;
    resourceTypes: TypeModules;
    blockTypes: TypeModules;
    languageTargets: TypeModules;
    deploymentTargets: TypeModules;
    setPluginPaths: (paths: string[]) => void;
}
// @ts-ignore
const kapeta: KapetaAPI = window.Kapeta;

export default kapeta;
