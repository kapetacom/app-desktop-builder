/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Box, Button, Slide, Stack, Typography } from '@mui/material';
import { Plan, validateSchema } from '@kapeta/schemas';
import { toClass } from '@kapeta/ui-web-utils';

import { useKapetaContext } from '../../../hooks/contextHook';
import { AssetInfo, AssetThumbnail, MissingReference } from '@kapeta/ui-web-plan-editor';
import { useLoadedPlanContext } from '../../../utils/planContextLoader';
import { useInstallerService } from '../../../api/installerService';
import { CoreTypes, EmptyStateBox, InstallerService } from '@kapeta/ui-web-components';
import { DesktopReferenceResolutionHandler } from '../../general/DesktopReferenceResolutionHandler';
import { ErrorBox, ExceptionWrapper, PlanExceptionWrapper } from '../../general/ExceptionWrapper';
import { getAssetTitle } from '../../plan-editor/helpers';

interface Props {
    plans: AssetInfo<Plan>[];
    onPlanOpen?: (plan: AssetInfo<Plan>) => void;
    onPlanCreate?: () => void;
    onPlanImport?: () => void;
}

const YourPlansListInner = (props: Props) => {
    const kapetaContext = useKapetaContext();
    const installerService = useInstallerService();

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
                    <Typography variant="h6">Your Plans will appear here</Typography>
                    <Typography
                        sx={{
                            '.MuiButtonBase-root': {
                                padding: 0,
                                minWidth: 0,
                            },
                        }}
                    >
                        You don't have any Plans yet.
                        <br />
                        <Button variant="text" onClick={props.onPlanCreate} data-kap-id="empty-state-create-button">
                            Create
                        </Button>
                        <span>, </span>
                        <Button
                            variant="text"
                            onClick={() => kapetaContext.blockHub.open()}
                            data-kap-id="empty-state-find-button"
                        >
                            Find
                        </Button>
                        <span> or </span>
                        <Button variant="text" onClick={props.onPlanImport} data-kap-id="empty-state-import-button">
                            Import
                        </Button>
                        <span> a new Plan to see it here.</span>
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={props.onPlanCreate}
                        data-kap-id="empty-state-create-button"
                    >
                        Create new Plan
                    </Button>
                </Stack>

                <EmptyStateBox
                    size={170}
                    icon="launchpad"
                    title={
                        <Button
                            data-kap-id="empty-state-plans-docs-link"
                            variant="text"
                            component="a"
                            href="https://docs.kapeta.com/docs/plans"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            More about Plans
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
    }

    return (
        <Stack direction={'row'} flexWrap={'wrap'} alignItems={'flex-start'} alignContent={'flex-start'} gap={3}>
            {props.plans.map((plan) => {
                return (
                    <PlanTile
                        key={`plan_${plan.ref}`}
                        plan={plan}
                        installerService={installerService}
                        onPlanOpen={props.onPlanOpen}
                    />
                );
            })}
        </Stack>
    );
};

const PlanTile = ({
    plan,
    onPlanOpen,
    installerService,
}: {
    plan: AssetInfo<Plan>;
    installerService: InstallerService;
    onPlanOpen?: (plan: AssetInfo<Plan>) => void;
}) => {
    const planContext = useLoadedPlanContext(plan.content);
    const [resolverOpen, setResolverOpen] = React.useState(false);
    const [missingReferences, setMissingReferences] = React.useState<MissingReference[]>([]);

    return (
        <Box>
            <PlanExceptionWrapper
                plan={plan}
                sx={{
                    width: '368px',
                    height: '264px',
                    boxSizing: 'border-box',
                    borderRadius: '10px',
                }}
            >
                <DesktopReferenceResolutionHandler
                    open={resolverOpen}
                    plan={plan.content}
                    planRef={plan.ref}
                    planPath={plan.path}
                    blockAssets={planContext.blocks}
                    missingReferences={missingReferences}
                    onClose={() => setResolverOpen(false)}
                />
                <AssetThumbnail
                    width={366}
                    height={262}
                    asset={plan}
                    onMissingReferences={(missingReferences) => {
                        if (resolverOpen && missingReferences.length < 1) {
                            setResolverOpen(false);
                        }
                        setMissingReferences(missingReferences);
                    }}
                    installerService={installerService}
                    onClick={() => {
                        if (missingReferences.length > 0) {
                            setResolverOpen(true);
                        } else {
                            onPlanOpen && onPlanOpen(plan);
                        }
                    }}
                    loadPlanContext={() => {
                        return planContext;
                    }}
                />
            </PlanExceptionWrapper>
        </Box>
    );
};

export const YourPlansList = (props: Props) => {
    const className = toClass({
        'your-plans': true,
        empty: props.plans.length < 1,
    });
    return (
        <Box className={className}>
            <Typography variant={'h6'} pb={2}>
                Your plans
            </Typography>
            <YourPlansListInner {...props} />
        </Box>
    );
};
