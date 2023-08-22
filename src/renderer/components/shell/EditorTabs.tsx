import React, { useCallback, useEffect, useState } from 'react';
import { PlannerService } from '@kapeta/ui-web-context';
import { Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncRetry } from 'react-use';
import { getAssetTitle } from '../plan-editor/helpers';
import { KapetaTab, KapetaTabs, KapetaTabsType } from './components/KapetaTabs';
import { CustomIcon } from './components/CustomIcon';
import { navigate } from '@storybook/addon-links';
import { Person } from '@mui/icons-material';
import { usePlans } from '../../hooks/assetHooks';
const DEFAULT_URL = '/edit';
const useEditorTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [tabs, setTabs] = useState<string[]>(
        localStorage.getItem('editor-tabs') ? JSON.parse(localStorage.getItem('editor-tabs') || '') : [DEFAULT_URL]
    );
    useEffect(() => {
        // save to local storage
        localStorage.setItem('editor-tabs', JSON.stringify(tabs));
    }, [tabs]);

    const createTab = useCallback(
        (url = DEFAULT_URL, tabOpts: { navigate?: boolean } = {}) => {
            setTabs((tabState) => {
                return tabState.includes(url) ? tabState : [...tabState, url];
            });
            if (tabOpts.navigate) {
                navigate(url);
            }
        },
        [setTabs, navigate, DEFAULT_URL]
    );

    const closeTab = (tabUrl: string) => {
        // If the tab we're closing is the current tab, navigate to the previous tab, or default url if there is no previous tab
        setTabs((tabState) => {
            const newTabState = tabState.filter((tab) => tab !== tabUrl);
            if (location.pathname === tabUrl) {
                // Closing current tab
                const i = tabState.findIndex((tab) => tab === tabUrl) ?? -1;
                const nextTab = i > -1 ? tabState[i - 1] || tabState[i + 1] : tabState[0];
                if (nextTab) {
                    navigate(nextTab);
                } else {
                    if (!newTabState.includes(DEFAULT_URL)) {
                        newTabState.push(DEFAULT_URL);
                    }
                    navigate(DEFAULT_URL);
                }
            }
            return newTabState;
        });
    };

    return {
        tabs,
        createTab,
        closeTab,
    };
};

export const EditorTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const planAssets = usePlans();

    const { tabs, createTab, closeTab } = useEditorTabs();

    useEffect(() => {
        if (!location.pathname || location.pathname === '/') {
            navigate(DEFAULT_URL);
            return;
        }
        createTab(location.pathname, { navigate: false });
    }, [location.pathname, createTab]);

    return (
        <KapetaTabs value={location.pathname}>
            {tabs.map((url) => {
                let label: React.ReactNode = 'New tab';
                let variant: KapetaTabsType = 'edit';
                let icon = <CustomIcon icon="Plan" />;

                if (url.startsWith('/edit')) {
                    // If it is an editor tab:
                    if (/\/edit\/(.+)/.test(url)) {
                        // Open plan
                        const ref = decodeURIComponent(/\/edit\/(.+)/.exec(url)?.[1] ?? '');
                        const plan = planAssets.data?.find((a) => a.ref === ref);
                        if (!plan) {
                            console.warn('Plan not found', ref);
                            return null;
                        }
                        label = `${getAssetTitle(plan)} [${plan.version}]`;
                        icon = <CustomIcon icon="Plan" />;
                    } else {
                        icon = <CustomIcon icon="Plan" />;
                        label = 'My plans';
                    }
                } else if (url.startsWith('/deployments')) {
                    label = 'Deployments';
                    variant = 'deploy';
                    icon = <CustomIcon icon="Deploy" />;
                } else if (url.startsWith('/settings')) {
                    variant = 'deploy';
                    label = 'Settings';
                    icon = <Person />;
                } else {
                    console.warn('Unknown tab url', url);
                    return null;
                }

                return (
                    <KapetaTab
                        value={url}
                        href={url}
                        variant={variant}
                        icon={icon}
                        iconPosition="start"
                        label={
                            <div
                                style={{
                                    display: 'flex',
                                    maxWidth: 'calc(100% - 32px)',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        height: '1em',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {label}
                                </span>

                                <IconButton
                                    type="button"
                                    sx={{
                                        mr: '-14px',
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        closeTab(url);
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        }
                    />
                );
            })}
            <Button onClick={() => createTab(DEFAULT_URL, { navigate: true })}>
                <i className="fa fa-plus add-plan" />
            </Button>
        </KapetaTabs>
    );
};
