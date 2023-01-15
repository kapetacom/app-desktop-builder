

type TypeModules = {[key:string]:any};

export interface BlockwareAPI {
    paths:string[]
    resourceTypes: TypeModules,
    blockTypes: TypeModules,
    languageTargets: TypeModules,
    deploymentTargets: TypeModules,
    setPluginPaths: (paths:string[]) => void
}
// @ts-ignore
const bw:BlockwareAPI = window.Blockware;

export default bw;
