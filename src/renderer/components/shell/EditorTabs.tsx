import React, { useEffect } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAssetTitle } from '../plan-editor/helpers';
import { KapetaTab, KapetaTabs, KapetaTabsType } from './components/KapetaTabs';
import { CustomIcon } from './components/CustomIcon';
import { Person } from '@mui/icons-material';
import { useKapetaContext } from '../../hooks/contextHook';
import { DEFAULT_TAB_PATH, normalizeUrl, useMainTabs } from '../../hooks/mainTabs';
import { usePlans } from '../../hooks/assetHooks';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { Tooltip } from '@kapeta/ui-web-components';

export const EditorTabs = () => {
    const planAssets = usePlans();
    const location = useLocation();
    const navigate = useNavigate();
    const kapetaContext = useKapetaContext();
    const mainTabs = useMainTabs();

    useEffect(() => {
        if (!location.pathname || location.pathname === '/') {
            navigate(DEFAULT_TAB_PATH);
            return;
        }
        mainTabs.open(location.pathname, { navigate: false });
    }, [location.pathname, mainTabs.open]);

    return (
        <KapetaTabs value={normalizeUrl(location.pathname)} variant={'scrollable'}>
            {mainTabs.active.map((tabInfo) => {
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
                    label = tabInfo.title ?? 'Profile';
                    icon = <Person />;
                } else if (tabInfo.path.startsWith('/organizations')) {
                    const [, , handle] = tabInfo.path.split(/\//g);
                    variant = 'deploy';
                    label = tabInfo.title ?? handle ?? 'Organization';
                    icon = <ApartmentIcon />;
                } else {
                    console.warn('Unknown tab url', tabInfo);
                    return null;
                }

                let contextHandle: string | undefined = kapetaContext.activeContext?.identity.handle;
                if (tabInfo.contextId) {
                    if (kapetaContext.profile?.id === tabInfo.contextId) {
                        contextHandle = kapetaContext.profile.handle;
                    } else {
                        const membership = kapetaContext.contexts?.memberships.find(
                            (m) => m.identity.id === tabInfo.contextId
                        );
                        if (membership) {
                            contextHandle = membership.identity.handle;
                        }
                    }
                }

                let tooltipTitle = label;
                if (contextHandle) {
                    tooltipTitle = `${label} @ ${contextHandle}`;
                }

                const value = normalizeUrl(tabInfo.path);
                return (
                    <KapetaTab
                        value={value}
                        href={value}
                        variant={variant}
                        icon={icon}
                        iconPosition={'start'}
                        label={
                            <Stack
                                gap={'4px'}
                                alignItems={'center'}
                                width={'calc(100% - 32px)'}
                                direction={'row'}
                                justifyContent={'space-between'}
                            >
                                <Box flex={1} overflow={'hidden'}>
                                    <Tooltip title={tooltipTitle} enterDelay={1000} placement={'bottom'}>
                                        <Typography
                                            fontSize={'12px'}
                                            style={{
                                                width: '100%',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {label}
                                        </Typography>
                                    </Tooltip>
                                </Box>

                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        mainTabs.close(tabInfo.path);
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Stack>
                        }
                    />
                );
            })}
            <Button onClick={() => mainTabs.open(DEFAULT_TAB_PATH, { navigate: true })}>
                <i className="fa fa-plus add-plan" />
            </Button>
        </KapetaTabs>
    );
};
