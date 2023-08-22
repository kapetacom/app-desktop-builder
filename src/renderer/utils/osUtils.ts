const platform = () => {
    return (
        // @ts-ignore
        window.navigator.userAgentData?.platform?.toLowerCase() ?? window.navigator.platform?.toLowerCase()
    );
};
export const isWindows = () => {
    return ['win32', 'windows'].includes(platform());
};

export const isMac = () => {
    // @ts-ignore
    return ['macos', 'macintel'].includes(platform());
};

export const isLinux = () => {
    // @ts-ignore
    return !isWindows() && !isMac();
};
