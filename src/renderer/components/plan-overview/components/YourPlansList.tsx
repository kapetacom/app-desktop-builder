import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Asset } from '@kapeta/ui-web-types';
import { Plan } from '@kapeta/schemas';
import { Image } from '@mui/icons-material';
import { toClass } from '@kapeta/ui-web-utils';
import { AssetThumbnail } from '../../AssetThumbnail';
import { useKapetaContext } from '../../../hooks/contextHook';

interface Props {
    plans: Asset<Plan>[];
    onPlanOpen?: (plan: Asset<Plan>) => void;
    onPlanCreate?: () => void;
    onPlanImport?: () => void;
}

const YourPlansListInner = (props: Props) => {
    const kapetaContext = useKapetaContext();

    if (props.plans.length < 1) {
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
                                <a
                                    style={{ marginLeft: 0 }}
                                    onClick={props.onPlanCreate}
                                >
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
                            size={'large'}
                        >
                            Create new Plan
                        </Button>
                    </Box>
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        background:
                            'linear-gradient(242deg, rgba(244, 238, 238, 0.05) 0%, #F4EEEE 100%)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                        fontSize: '100px',
                    }}
                >
                    {/* @ts-ignore */}
                    <Image fontSize={'100px'} opacity={0.2} />
                </Box>
            </Stack>
        );
    }

    return (
        <Stack
            direction={'row'}
            flexWrap={'wrap'}
            alignItems={'flex-start'}
            alignContent={'flex-start'}
            gap={3}
        >
            {props.plans.map((plan, index) => {
                return (
                    <AssetThumbnail
                        key={`plan_${index}`}
                        width={368}
                        height={264}
                        asset={plan}
                        onClick={props.onPlanOpen}
                    />
                );
            })}
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