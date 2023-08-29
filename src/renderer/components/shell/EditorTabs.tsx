import React, { useEffect } from 'react';
import { Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAssetTitle } from '../plan-editor/helpers';
import { KapetaTab, KapetaTabs, KapetaTabsType } from './components/KapetaTabs';
import { CustomIcon } from './components/CustomIcon';
import { Person } from '@mui/icons-material';
import { useKapetaContext } from '../../hooks/contextHook';
import { DEFAULT_TAB_PATH, normalizeUrl } from '../../hooks/mainTabs';
import { usePlans } from '../../hooks/assetHooks';

export const EditorTabs = () => {
    const planAssets = usePlans();
    const location = useLocation();
    const navigate = useNavigate();
    const kapetaContext = useKapetaContext();

    useEffect(() => {
        if (!location.pathname || location.pathname === '/') {
            navigate(DEFAULT_TAB_PATH);
            return;
        }
        kapetaContext.tabs.open(location.pathname, { navigate: false });
    }, [location.pathname, kapetaContext.tabs.open]);

    return (
        <KapetaTabs value={normalizeUrl(location.pathname)} variant={'scrollable'}>
            {kapetaContext.tabs.active.map((tabInfo) => {
                let label: React.ReactNode = 'New tab';
                let variant: KapetaTabsType = 'edit';
                let icon = <CustomIcon icon="Plan" />;

                if (tabInfo.path.startsWith('/edit')) {
                    // If it is an editor tab:
                    if (/\/edit\/(.+)/.test(tabInfo.path)) {
                        // Open plan
                        const ref = decodeURIComponent(/\/edit\/(.+)/.exec(tabInfo.path)?.[1] ?? '');
                        const plan = planAssets.data?.find((a) => a.ref === ref);
                        if (!plan) {
                            console.warn('Plan not found', ref);
                            return null;
                        }
                        label = tabInfo.title ?? `${getAssetTitle(plan)} [${plan.version}]`;
                        icon = <CustomIcon icon="Plan" />;
                    } else {
                        icon = <CustomIcon icon="Plan" />;
                        label = 'My plans';
                    }
                } else if (tabInfo.path.startsWith('/deployments')) {
                    icon = <CustomIcon icon="Deploy" />;
                    variant = 'deploy';
                    if (tabInfo.path === '/deployments') {
                        label = 'Deployments';
                    } else {
                        const ref = decodeURIComponent(/\/deployments\/(.+)/.exec(tabInfo.path)?.[1] ?? '');
                        if (ref.includes('/')) {
                            const [handle, name, version] = ref.split(/\//);
                            label = tabInfo.title ?? `${name} [${version}]`;
                        } else {
                            label = tabInfo.title ?? ref;
                        }
                    }
                } else if (tabInfo.path.startsWith('/settings')) {
                    variant = 'deploy';
                    label = tabInfo.title ?? 'Settings';
                    icon = <Person />;
                } else {
                    console.warn('Unknown tab url', tabInfo);
                    return null;
                }

                const value = normalizeUrl(tabInfo.path);
                return (
                    <KapetaTab
                        value={value}
                        href={value}
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
                                        kapetaContext.tabs.close(tabInfo.path);
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        }
                    />
                );
            })}
            <Button onClick={() => kapetaContext.tabs.open(DEFAULT_TAB_PATH, { navigate: true })}>
                <i className="fa fa-plus add-plan" />
            </Button>
        </KapetaTabs>
    );
};
