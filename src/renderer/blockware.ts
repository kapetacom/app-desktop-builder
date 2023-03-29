type TypeModules = { [key: string]: any };

export interface KapetaAPI {
    paths: string[];
    resourceTypes: TypeModules;
    blockTypes: TypeModules;
    languageTargets: TypeModules;
    deploymentTargets: TypeModules;
    setPluginPaths: (paths: string[]) => void;
}
// @ts-ignore
const bw: KapetaAPI = window.Kapeta;

export default bw;
