import React, { useEffect } from 'react';
import { Box, IconButton, Stack, Typography, SvgIcon, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAssetTitle } from '../plan-editor/helpers';
import { KapetaTab, KapetaTabs, KapetaTabsType } from './components/KapetaTabs';
import { useKapetaContext } from '../../hooks/contextHook';
import { DEFAULT_TAB_PATH, normalizeUrl, useMainTabs } from '../../hooks/mainTabs';
import { usePlans } from '../../hooks/assetHooks';
import { KindIcon, Tooltip } from '@kapeta/ui-web-components';
import AddIcon from '@mui/icons-material/Add';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CloseIcon from '@mui/icons-material/Close';
import DeployIcon from './components/icons/DeployIcon.svg';
import PersonIcon from '@mui/icons-material/Person';

export const EditorTabs = () => {
    const planAssets = usePlans();
    const location = useLocation();
    const navigate = useNavigate();
    const kapetaContext = useKapetaContext();
    const mainTabs = useMainTabs();

    useEffect(() => {
        if (!location.pathname || location.pathname === '/') {
            navigate(DEFAULT_TAB_PATH, { replace: true });
            return;
        }
        mainTabs.open(location.pathname, { navigate: false });
    }, [location.pathname, mainTabs.open, navigate]);

    const defaultTabOpen = mainTabs.active.some((tab) => tab.path === DEFAULT_TAB_PATH);

    return (
        <>
            <KapetaTabs value={normalizeUrl(location.pathname)} variant={'scrollable'}>
                {mainTabs.active.map((tabInfo) => {
                    let label: React.ReactNode = 'New tab';
                    let variant: KapetaTabsType = 'edit';
                    let icon = <KindIcon kind="core/plan" size={16} />;

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
                            icon = <KindIcon kind="core/plan" size={16} />;
                        } else {
                            icon = <KindIcon kind="core/plan" size={16} />;
                            label = 'My plans';
                        }
                    } else if (tabInfo.path.startsWith('/deployments')) {
                        icon = <SvgIcon component={DeployIcon} />;
                        variant = 'deploy';
                        if (tabInfo.path === '/deployments') {
                            label = 'Deployments';
                        } else {
                            const ref = decodeURIComponent(/\/deployments\/(.+)/.exec(tabInfo.path)?.[1] ?? '');
                            if (ref.includes('/')) {
                                const [handle, name] = ref.split(/\//);
                                label = tabInfo.title ?? name;
                            } else {
                                label = tabInfo.title ?? ref;
                            }
                        }
                    } else if (tabInfo.path.startsWith('/settings')) {
                        variant = 'deploy';
                        label = tabInfo.title ?? 'Profile';
                        icon = <PersonIcon />;
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
                    const isCloseable = mainTabs.active.length > 1;
                    return (
                        <KapetaTab
                            key={value}
                            value={value}
                            href={value}
                            variant={variant}
                            icon={icon}
                            iconPosition={'start'}
                            sx={{
                                pr: isCloseable ? 0.5 : 2,
                                '& .MuiSvgIcon-root': {
                                    fontSize: '16px',
                                },
                            }}
                            label={
                                <Stack
                                    gap={'4px'}
                                    alignItems={'center'}
                                    flexGrow={1}
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

                                    {isCloseable ? (
                                        <IconButton
                                            className={'close-button'}
                                            type="button"
                                            size="small"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                mainTabs.close(tabInfo.path);
                                            }}
                                            sx={{
                                                '& .MuiSvgIcon-root': { fontSize: '13px' },
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    ) : null}
                                </Stack>
                            }
                        />
                    );
                })}
            </KapetaTabs>
            {!defaultTabOpen && (
                <Button
                    onClick={() => mainTabs.open(DEFAULT_TAB_PATH, { navigate: true })}
                    sx={{ color: 'white', height: '100%' }}
                >
                    <AddIcon />
                </Button>
            )}
        </>
    );
};
