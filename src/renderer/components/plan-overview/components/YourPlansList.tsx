import React from 'react';
import { Box, Button, Slide, Stack, Typography } from '@mui/material';
import { Plan } from '@kapeta/schemas';
import ImageIcon from '@mui/icons-material/Image';
import { toClass } from '@kapeta/ui-web-utils';

import { useKapetaContext } from '../../../hooks/contextHook';
import { TransitionGroup } from 'react-transition-group';
import { AssetInfo, AssetThumbnail } from '@kapeta/ui-web-plan-editor';
import { useLoadedPlanContext } from '../../../utils/planContextLoader';
import { installerService } from '../../../api/installerService';
import { grey } from '@mui/material/colors';
import { EmptyStateBox } from '@kapeta/ui-web-components';

interface Props {
    plans: AssetInfo<Plan>[];
    onPlanOpen?: (plan: AssetInfo<Plan>) => void;
    onPlanCreate?: () => void;
    onPlanImport?: () => void;
}

const YourPlansListInner = (props: Props) => {
    const kapetaContext = useKapetaContext();

    if (props.plans.length < 1) {
        return (
            <Stack direction="row" flexGrow={1} sx={{ maxWidth: '1152px' }}>
                <Stack
                    sx={{
                        border: '1px solid #0000001f',
                        borderRight: 0,
                        alignItems: 'flex-start',
                        p: 4,
                        pt: 6,
                        pb: 12,
                        borderTopLeftRadius: '10px',
                        borderBottomLeftRadius: '10px',
                        flexBasis: '50%',
                        maxWidth: '380px',
                    }}
                    gap={2}
                >
                    <Typography variant="h6">Your plans will appear here</Typography>
                    <Typography
                        sx={{
                            '.MuiButtonBase-root': {
                                padding: 0,
                                minWidth: 0,
                            },
                        }}
                    >
                        You don't have any plans yet.
                        <br />
                        <Button variant="text" onClick={props.onPlanCreate}>
                            Create
                        </Button>
                        <span>, </span>
                        <Button variant="text" onClick={() => kapetaContext.blockHub.open()}>
                            Find
                        </Button>
                        <span> or </span>
                        <Button variant="text" onClick={props.onPlanImport}>
                            Import
                        </Button>
                        <span> a new Plan to see it here.</span>
                    </Typography>

                    <Button variant="contained" color="primary" onClick={props.onPlanCreate}>
                        Create new Plan
                    </Button>
                </Stack>

                <EmptyStateBox
                    size={170}
                    icon="launchpad"
                    title={
                        <Button
                            variant="text"
                            component="a"
                            href="https://docs.kapeta.com/docs/plans"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            More about plans
                        </Button>
                    }
                    sx={{
                        backgroundColor: '#f9f9f9',
                        flexGrow: 1,
                        borderRadius: '10px',
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 0,
                        flexBasis: '50%',
                    }}
                />
            </Stack>
        );

        return (
            <Stack
                sx={{
                    borderRadius: '10px',
                    border: '1px dashed rgba(55, 71, 79, 0.50)',
                    height: '350px',
                }}
                direction={'row'}
                gap={4}
                pl={6}
            >
                <Box
                    sx={{
                        width: '303px',
                    }}
                >
                    <Box
                        sx={{
                            flex: 0,
                            height: '150px',
                            padding: '24px 0',
                        }}
                    >
                        <Typography
                            pb={3}
                            sx={{
                                a: {
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    margin: '0 3px',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                },
                            }}
                        >
                            <p>
                                <span>You don’t have any Plans, yet.</span>
                            </p>
                            <p>
                                <a style={{ marginLeft: 0 }} onClick={props.onPlanCreate}>
                                    Create
                                </a>
                                <span>,</span>
                                <a
                                    onClick={() => {
                                        kapetaContext.blockHub.open();
                                    }}
                                >
                                    Find
                                </a>
                                <span>or</span>
                                <a onClick={props.onPlanImport}>Import</a>
                                <span>a new Plan to see it here.</span>
                            </p>
                        </Typography>
                        <Button
                            variant={'outlined'}
                            color={'inherit'}
                            sx={{
                                '&:hover': {
                                    bgcolor: grey[100],
                                },
                            }}
                            size={'large'}
                            onClick={props.onPlanCreate}
                        >
                            Create new Plan
                        </Button>
                    </Box>
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        background: 'linear-gradient(242deg, rgba(244, 238, 238, 0.05) 0%, #F4EEEE 100%)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                        fontSize: '100px',
                    }}
                >
                    <ImageIcon opacity={0.2} sx={{ fontSize: '100px' }} />
                </Box>
            </Stack>
        );
    }

    return (
        <Stack direction={'row'} flexWrap={'wrap'} alignItems={'flex-start'} alignContent={'flex-start'} gap={3}>
            <TransitionGroup component={null} enter={true} exit={true} appear={true}>
                {props.plans.map((plan, index) => {
                    return (
                        <Slide key={`plan_${plan.ref}`} direction={'right'} unmountOnExit={true} mountOnEnter={true}>
                            <AssetThumbnail
                                key={`plan_${plan.ref}`}
                                width={366}
                                height={262}
                                asset={plan}
                                installerService={installerService}
                                onClick={props.onPlanOpen}
                                loadPlanContext={(plan) => {
                                    return useLoadedPlanContext(plan.content);
                                }}
                            />
                        </Slide>
                    );
                })}
            </TransitionGroup>
        </Stack>
    );
};

export const YourPlansList = (props: Props) => {
    const className = toClass({
        'your-plans': true,
        empty: props.plans.length < 1,
    });
    return (
        <Box className={className}>
            <Typography variant={'h6'} pb={2} pt={2}>
                Your plans
            </Typography>
            <YourPlansListInner {...props} />
        </Box>
    );
};
