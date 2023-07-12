import React, { useCallback, useEffect, useState } from 'react';
import { PlannerService } from '@kapeta/ui-web-context';
import { Button, Tab, Tabs } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncRetry } from 'react-use';
import { getAssetTitle } from '../plan-editor/helpers';

interface TabOptions {
    defaultUrl?: string;
}
const useEditorTabs = (opts: TabOptions) => {
    const defaultUrl = opts.defaultUrl || '/';

    const location = useLocation();
    const navigate = useNavigate();

    const [tabs, setTabs] = useState<string[]>(
        localStorage.getItem('editor-tabs')
            ? JSON.parse(localStorage.getItem('editor-tabs') || '')
            : [defaultUrl]
    );
    useEffect(() => {
        // save to local storage
        localStorage.setItem('editor-tabs', JSON.stringify(tabs));
    }, [tabs]);

    const createTab = useCallback(
        (url = defaultUrl, tabOpts: { navigate?: boolean } = {}) => {
            setTabs((tabState) => {
                return tabState?.includes(url)
                    ? tabState
                    : (tabState || []).concat([url]);
            });
            if (tabOpts.navigate) {
                navigate(url);
            }
        },
        [setTabs, navigate, defaultUrl]
    );

    const closeTab = (tabUrl: string) => {
        // If the tab we're closing is the current tab, navigate to the previous tab, or default url if there is no previous tab
        setTabs((tabState) => {
            if (location.pathname === tabUrl) {
                const i = tabState?.findIndex((tab) => tab === tabUrl) ?? -1;
                const newTab =
                    i > -1
                        ? tabState?.[i - 1] || tabState?.[i + 1]
                        : tabState?.[0];
                if (newTab) {
                    navigate(newTab);
                } else {
                    navigate(defaultUrl);
                    return [defaultUrl];
                }
            }
            return tabState?.filter((tab) => tab !== tabUrl);
        });
    };

    return {
        tabs,
        createTab,
        closeTab,
    };
};

export const EditorTabs = () => {
    const defaultUrl = '/edit';
    const location = useLocation();

    const planAssets = useAsyncRetry(() => PlannerService.list(), []);

    const { tabs, createTab, closeTab } = useEditorTabs({
        defaultUrl,
    });

    useEffect(() => {
        createTab(location.pathname, { navigate: false });
    }, [location.pathname, createTab]);

    console.log(location.pathname);

    return (
        <Tabs
            sx={(theme) => ({
                // Remove mui tab indicator (underline)
                '& .MuiTabs-indicator': {
                    display: 'none',
                },
                '& .MuiButton-root': {
                    color: theme.palette.common.white,
                },
            })}
            value={location.pathname}
        >
            {tabs?.map((url) => {
                let label: React.ReactNode = 'New tab';

                if (/\/edit/.test(url)) {
                    // If it is an editor tab:
                    const ref = decodeURIComponent(
                        /\/edit\/(.+)/.exec(url)?.[1] ?? ''
                    );
                    const plan = planAssets.value?.find(
                        (planx) => planx.ref === ref
                    );
                    label = plan
                        ? `${getAssetTitle(plan)} [${plan.version}]`
                        : 'My Plans';
                } else if (/\/deployments\b/.test(url)) {
                    label = 'Deployments';
                } else if (/\/blockhub\b/.test(url)) {
                    // If it is a blockhub tab:
                    label = 'Blockhub';
                }

                // ...

                return (
                    <Tab
                        sx={(theme) => ({
                            // TODO: Replace this with a proper theme / component tokens
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.common.white,
                            },
                        })}
                        value={url}
                        href={url}
                        label={
                            <div>
                                {label}
                                &nbsp;
                                <button
                                    style={{
                                        all: 'unset',
                                    }}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        closeTab(url);
                                    }}
                                >
                                    <i className="fal fa-times close-plan" />
                                </button>
                            </div>
                        }
                    />
                );
            })}
            <Button onClick={() => createTab(defaultUrl, { navigate: true })}>
                <i className="fa fa-plus add-plan" />
            </Button>
        </Tabs>
    );
};
