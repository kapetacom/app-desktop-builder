/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePlans } from './assetHooks';
import { useNavigate } from 'react-router-dom';
import { MainTabs, TabInfo, TabOptions } from './types';
import { MemberIdentity } from '@kapeta/ui-web-types';
import { useKapetaContext } from './contextHook';
import { useRoutingPath } from '@kapeta/web-microfrontend/browser';
import { parseKapetaUri } from '@kapeta/nodejs-utils';

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

    if (url.includes('?')) {
        url = url.split('?')[0];
    }

    return url;
}

/**
 * Returns true if the path is context-sensitive, meaning it should be scoped to a specific contextId
 */
function isContextSensitive(path: string) {
    return (
        (path.startsWith('/deployments') && path !== '/deployments') ||
        (path.startsWith('/metrics') && path !== '/metrics')
    );
}

export const MainTabsContext = createContext<MainTabs>({
    active: [],
    current: {
        path: '',
    },
    close: () => {},
    open: () => {},
    setTitle: () => {},
    setContext: () => {},
});

export const MainTabsContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const kapetaContext = useKapetaContext();
    const mainTabsContext = createMainTabsContext(kapetaContext.activeContext);

    return <MainTabsContext.Provider value={mainTabsContext}>{children}</MainTabsContext.Provider>;
};

export const useMainTabs = () => {
    return useContext(MainTabsContext);
};

const createMainTabsContext = (context?: MemberIdentity): MainTabs => {
    const navigate = useNavigate();
    const planAssets = usePlans();
    const currentPathWithSearch = useRoutingPath();
    const [navigateDestination, setNavigateDestination] = useState<string | undefined>(undefined);

    const tabFilter = useCallback(
        (tabInfo: TabInfo) => {
            if (tabInfo.path.startsWith('/edit')) {
                // If it is an editor tab:
                if (/\/edit\/(.+)/.test(tabInfo.path)) {
                    // Open plan
                    if (planAssets.loading) {
                        // We dont know yet if the plan exists, so we'll keep the tab open
                        return true;
                    }
                    try {
                        const ref = decodeURIComponent(/\/edit\/(.+)/.exec(tabInfo.path)?.[1] ?? '');
                        const plan = planAssets.data?.find((a) => parseKapetaUri(a.ref).equals(parseKapetaUri(ref)));
                        if (!plan) {
                            return false;
                        }
                        return true;
                    } catch (e) {
                        console.error(e);
                        return false;
                    }
                }
                return true;
            }

            if (tabInfo.path.startsWith('/deployments')) {
                return true;
            }

            if (tabInfo.path.startsWith('/metrics')) {
                return true;
            }

            if (tabInfo.path.startsWith('/settings')) {
                return true;
            }

            if (tabInfo.path.startsWith('/organizations')) {
                return true;
            }

            if (tabInfo.path.startsWith('/new-plan')) {
                return true;
            }

            return false;
        },
        [planAssets.loading, planAssets.data]
    );

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
        if (planAssets.loading) {
            // Wait for plans to load
            return;
        }
        // save to local storage
        localStorage.setItem(TAB_LOCAL_STORAGE, JSON.stringify(tabs.filter(tabFilter)));
    }, [tabs, planAssets.loading]);

    const openTab = useCallback(
        (path = DEFAULT_TAB_PATH, opts: TabOptions = {}) => {
            const normalizedPath = normalizeUrl(path);
            setTabs((previous) => {
                const contextId = isContextSensitive(normalizedPath)
                    ? opts.contextId || context?.identity.id
                    : undefined;
                const existingTabIx = previous.findIndex((tab) => tab.path === normalizedPath);
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
                        path: normalizedPath,
                        title: opts.title,
                        contextId,
                    },
                ];
            });
            if (opts.navigate) {
                // Use async navigate to make it play nice with async setTabs above
                setNavigateDestination(() => normalizedPath);
            }
        },
        [setTabs, navigate, context, DEFAULT_TAB_PATH, DEFAULT_TITLE]
    );

    const closeTab = useCallback(
        (path: string) => {
            const normalizedPath = normalizeUrl(path);
            // If the tab we're closing is the current tab, navigate to the previous tab, or default url if there is no previous tab
            setTabs((previous) => {
                const newTabState = previous.filter((tab) => tab.path !== normalizedPath);
                if (normalizeUrl(currentPathWithSearch) === normalizedPath) {
                    // Closing current tab

                    const i = previous.findIndex((tab) => tab.path === normalizedPath) ?? -1;
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
        [currentPathWithSearch, tabs, navigate, setTabs, DEFAULT_TAB_PATH, DEFAULT_TITLE]
    );

    // listen for tab events from main process
    useEffect(() => {
        return window.electron.ipcRenderer.on(
            'change-tab',
            (cmd: 'new' | 'prev' | 'next' | 'switch' | 'close' | 'reopen', i: number) => {
                switch (cmd) {
                    case 'prev': {
                        const currentIndex = tabs.findIndex((t) => t.path === currentPathWithSearch);
                        // previous tab w/ wrap-around
                        const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1];
                        if (previousTab) {
                            navigate(previousTab.path);
                        }
                        break;
                    }
                    case 'next': {
                        const currentIndex = tabs.findIndex((t) => t.path === currentPathWithSearch);
                        // next tab with wrap-around:
                        const nextTab = tabs[currentIndex + 1] || tabs[0];
                        if (nextTab) {
                            navigate(nextTab.path);
                        }
                        break;
                    }
                    case 'close':
                        closeTab(currentPathWithSearch);
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
    }, [openTab, closeTab, navigate, tabs, currentPathWithSearch]);

    useEffect(() => {
        // Async navigate to destination to allow for tab to be created
        if (navigateDestination) {
            navigate(navigateDestination);
        }
        setNavigateDestination(undefined);
    }, [navigateDestination]);

    return useMemo(
        () => ({
            current: tabs.filter(tabFilter).find((t) => t.path === currentPathWithSearch) ?? tabs[0],
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
        }),
        [tabs, openTab, closeTab, currentPathWithSearch, setTabs, tabFilter]
    );
};
