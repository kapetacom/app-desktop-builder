import { usePlans } from './assetHooks';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainTabs, TabInfo, TabOptions } from './types';

const TAB_LOCAL_STORAGE = '$main_tabs';
export const DEFAULT_TAB_PATH = '/edit';
export const DEFAULT_TITLE = 'My Plans';

export function normalizeUrl(url: string) {
    if (/^\/deployments\/[^\/]+\/?$/i.test(url)) {
        // If this is the overview level - open the same tab
        url = '/deployments';
    }
    return url;
}
export const useMainTabs = (): MainTabs => {
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
                path = normalizeUrl(path);
                return previous.some((tab) => tab.path === path)
                    ? previous
                    : [
                          ...previous,
                          {
                              path,
                              title: opts.title,
                          },
                      ];
            });
            if (opts.navigate) {
                navigate(path);
            }
        },
        [setTabs, navigate, DEFAULT_TAB_PATH]
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

    return {
        current: tabs.find((t) => t.path === location.pathname) ?? tabs[0],
        active: tabs.filter(tabFilter),
        open: openTab,
        close: closeTab,
        setTitle: (path: string, title: string) => {
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
