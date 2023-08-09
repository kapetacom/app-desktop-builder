export const isWindows = () => {
    //@ts-ignore
    return window.navigator.userAgentData.platform.toLowerCase() === 'windows';
};

export const isMac = () => {
    //@ts-ignore
    return window.navigator.userAgentData.platform.toLowerCase() === 'macos';
};

export const isLinux = () => {
    //@ts-ignore
    return window.navigator.userAgentData.platform.toLowerCase() === 'linux';
};
