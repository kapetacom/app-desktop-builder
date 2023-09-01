import { usePlans } from './assetHooks';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainTabs, TabInfo, TabOptions } from './types';
import { MemberIdentity } from '@kapeta/ui-web-types';

const TAB_LOCAL_STORAGE = '$main_tabs';
export const DEFAULT_TAB_PATH = '/edit';
export const DEFAULT_TITLE = 'My Plans';

export function normalizeUrl(url: string) {
    if (url.startsWith('/settings')) {
        url = '/settings';
    }

    if (url.startsWith('/organizations')) {
        const handle = /\/organizations\/([^\/]+)/.exec(url)?.[1];
        if (handle) {
            url = `/organizations/${handle}`;
        } else {
            url = '/organizations';
        }
    }
    return url;
}

/**
 * Returns true if the path is context-sensitive, meaning it should be scoped to a specific contextId
 */
function isContextSensitive(path: string) {
    return path.startsWith('/deployments') && path !== '/deployments';
}
export const useMainTabs = (context?: MemberIdentity): MainTabs => {
    const location = useLocation();
    const navigate = useNavigate();
    const planAssets = usePlans();

    const tabFilter = (tabInfo: TabInfo) => {
        if (tabInfo.path.startsWith('/edit')) {
            // If it is an editor tab:
            if (/\/edit\/(.+)/.test(tabInfo.path)) {
                // Open plan
                const ref = decodeURIComponent(/\/edit\/(.+)/.exec(tabInfo.path)?.[1] ?? '');
                const plan = planAssets.data?.find((a) => a.ref === ref);
                if (!plan) {
                    return false;
                }
                return true;
            }
            return true;
        }

        if (tabInfo.path.startsWith('/deployments')) {
            return true;
        }

        if (tabInfo.path.startsWith('/settings')) {
            return true;
        }

        if (tabInfo.path.startsWith('/organizations')) {
            return true;
        }

        return false;
    };

    const [tabs, setTabs] = useState<TabInfo[]>(
        localStorage.getItem(TAB_LOCAL_STORAGE)
            ? JSON.parse(localStorage.getItem(TAB_LOCAL_STORAGE) || '')
            : [
                  {
                      title: DEFAULT_TITLE,
                      path: DEFAULT_TAB_PATH,
                  },
              ]
    );
    useEffect(() => {
        // save to local storage
        localStorage.setItem(TAB_LOCAL_STORAGE, JSON.stringify(tabs.filter(tabFilter)));
    }, [tabs]);

    const openTab = useCallback(
        (path = DEFAULT_TAB_PATH, opts: TabOptions = {}) => {
            setTabs((previous) => {
                const contextId = isContextSensitive(path) ? opts.contextId || context?.identity.id : undefined;
                path = normalizeUrl(path);
                const existingTabIx = previous.findIndex((tab) => tab.path === path);
                if (existingTabIx > -1) {
                    const existingTab = previous[existingTabIx];
                    if (opts.contextId && existingTab.contextId !== opts.contextId) {
                        // We only do this if we've specifically requested a contextId change
                        const out = [...previous];
                        out[existingTabIx] = { ...existingTab, contextId };
                        return out;
                    }
                    return previous;
                }
                return [
                    ...previous,
                    {
                        path,
                        title: opts.title,
                        contextId,
                    },
                ];
            });
            if (opts.navigate) {
                navigate(path);
            }
        },
        [setTabs, navigate, context, DEFAULT_TAB_PATH]
    );

    const closeTab = useCallback(
        (path: string) => {
            if (path === DEFAULT_TAB_PATH) {
                // Can't close the default tab
                return;
            }

            // If the tab we're closing is the current tab, navigate to the previous tab, or default url if there is no previous tab
            setTabs((previous) => {
                const newTabState = previous.filter((tab) => tab.path !== path);
                if (normalizeUrl(location.pathname) === path) {
                    // Closing current tab

                    const i = previous.findIndex((tab) => tab.path === path) ?? -1;
                    const nextTab = i > -1 ? previous[i - 1] || previous[i + 1] : previous[0];
                    if (nextTab) {
                        navigate(nextTab.path);
                    } else {
                        if (!newTabState.some((t) => t.path === DEFAULT_TAB_PATH)) {
                            newTabState.push({
                                title: DEFAULT_TITLE,
                                path: DEFAULT_TAB_PATH,
                            });
                        }
                        navigate(DEFAULT_TAB_PATH);
                    }
                }
                return newTabState;
            });
        },
        [location.pathname, tabs]
    );

    // listen for tab events from main process
    useEffect(() => {
        return window.electron.ipcRenderer.on(
            'change-tab',
            (cmd: 'new' | 'prev' | 'next' | 'switch' | 'close' | 'reopen', i) => {
                switch (cmd) {
                    case 'prev': {
                        const currentIndex = tabs.findIndex((t) => t.path === location.pathname);
                        // previous tab w/ wrap-around
                        const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1];
                        if (previousTab) {
                            navigate(previousTab.path);
                        }
                        break;
                    }
                    case 'next': {
                        const currentIndex = tabs.findIndex((t) => t.path === location.pathname);
                        // next tab with wrap-around:
                        const nextTab = tabs[currentIndex + 1] || tabs[0];
                        if (nextTab) {
                            navigate(nextTab.path);
                        }
                        break;
                    }
                    case 'close':
                        closeTab(location.pathname);
                        break;
                    case 'switch': {
                        const tab = tabs[i];
                        if (tab) {
                            navigate(tab.path);
                        }
                        break;
                    }
                    case 'new': {
                        openTab(DEFAULT_TAB_PATH, { navigate: true });
                        break;
                    }
                    case 'reopen':
                        // TODO: implement tab reopening
                        break;
                    default:
                    // do nothing
                }
            }
        );
    }, [openTab, closeTab, navigate, tabs, location.pathname]);

    return {
        current: tabs.find((t) => t.path === location.pathname) ?? tabs[0],
        active: tabs.filter(tabFilter),
        open: openTab,
        close: closeTab,
        setContext: (path: string, contextId: string | undefined) => {
            path = normalizeUrl(path);
            setTabs((tabState) => {
                const i = tabState.findIndex((tab) => tab.path === path);
                if (i > -1) {
                    tabState[i] = { ...tabState[i], contextId };
                    return [...tabState];
                }
                return tabState;
            });
        },
        setTitle: (path: string, title: string) => {
            path = normalizeUrl(path);
            setTabs((tabState) => {
                const i = tabState.findIndex((tab) => tab.path === path);
                if (i > -1) {
                    tabState[i] = { ...tabState[i], title };
                    return [...tabState];
                }
                return tabState;
            });
        },
    };
};
