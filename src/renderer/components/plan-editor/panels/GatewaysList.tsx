/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { GatewayCard, PlannerContext } from '@kapeta/ui-web-plan-editor';
import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { withErrorBoundary } from 'react-error-boundary';
import { useContext } from 'react';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockDefinition } from '@kapeta/schemas';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { BlockInstance } from '@kapeta/schemas';
import { BlockInfo } from '../types';
import { useEffect } from 'react';
import { useAsyncRetry } from 'react-use';
import { InstanceService } from '../../../api/InstanceService';
import { TipIcon } from '@kapeta/ui-web-plan-editor/src/components/TipIcon';

interface PlannerGatewaysListProps {
    /**
     * System id / plan id
     */
    systemId: string;
    onConfigure: (info: BlockInfo) => void;
    readOnly?: boolean;
}

export const PlannerGatewaysList = withErrorBoundary(
    (props: PlannerGatewaysListProps) => {
        const planner = useContext(PlannerContext);

        const instanceStates = useAsyncRetry(
            async () => InstanceService.getInstanceStatusForSystem(props.systemId),
            [props.systemId]
        );

        useEffect(() => {
            const i = setInterval(() => {
                if (!instanceStates.loading) {
                    instanceStates.retry();
                }
            }, 2000);
            return () => clearInterval(i);
        }, [instanceStates.retry]);

        // Gateways are public links
        const blocks = planner.plan?.spec.blocks
            .map((block) => {
                try {
                    const definition = planner.getBlockById(block.id);
                    const state = instanceStates.value?.find((state) => state.instanceId === block.id);

                    return {
                        id: block.id,
                        definition: definition!,
                        status: state?.status || InstanceStatus.STOPPED,
                        instance: block,
                        public:
                            definition?.kind &&
                            parseKapetaUri(definition?.kind).fullName === 'kapeta/block-type-gateway-http',
                        url: state?.address,
                    };
                } catch (e) {
                    // Fallthrough in case of invalid URI
                }
                return null;
            })
            .filter(Boolean) as Array<{
            id: string;
            definition: BlockDefinition;
            status: InstanceStatus;
            instance: BlockInstance;
            public: boolean;
            url?: string;
        }>;
        const gateways = blocks.filter((block) => block.public);
        const internal = blocks.filter((block) => !block.public);

        return (
            <Stack gap={4} sx={{ py: 3 }}>
                <Stack gap={1.5} data-kap-id="plan-editor-gateways-public">
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Typography
                            variant={'h3'}
                            fontSize={'14px'}
                            fontWeight={700}
                            sx={{ display: 'inline-flex', alignItem: 'center' }}
                        >
                            Public URLs
                            <TipIcon
                                content={
                                    <>
                                        Public URLs for Gateways in your plan. Gateways will get a <b>kapeta.dev</b> URL
                                        in cloud environments.
                                        <br />
                                        <br />
                                        Public URLs can be configured for <b>custom domains in the gateway settings</b>.
                                    </>
                                }
                                placement="top-start"
                            />
                        </Typography>
                    </Stack>

                    {gateways.length ? (
                        gateways.map(({ id: blockId, definition, status, instance, url }) => {
                            return (
                                <GatewayCard
                                    key={blockId}
                                    title={instance.name || definition.metadata.title || definition.metadata.name}
                                    loading={status === InstanceStatus.STARTING || status === InstanceStatus.STOPPING}
                                    fallbackText="Open on localhost"
                                    fallback={{
                                        url: url || null,
                                        status: status === InstanceStatus.READY ? 'ok' : undefined,
                                    }}
                                    onConfigureGateway={() => {
                                        props.onConfigure({ block: definition, instance });
                                    }}
                                />
                            );
                        })
                    ) : props.readOnly ? (
                        <Typography variant={'body2'}>No public URLs available for this plan.</Typography>
                    ) : (
                        <Typography variant={'body2'}>
                            No public URLs yet. Add public URLs to the plan by adding Gateway blocks.
                        </Typography>
                    )}
                </Stack>

                <Stack gap={1.5} data-kap-id={'plan-editor-gateways-internal'}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Typography
                            variant={'h3'}
                            fontSize={'14px'}
                            fontWeight={700}
                            sx={{ display: 'inline-flex', alignItem: 'center' }}
                        >
                            Internal URLs
                            <TipIcon
                                content={
                                    <>
                                        Internal URLs will show for running blocks during local development, and are{' '}
                                        <b>not available in cloud environments</b>. <br />
                                        <br />
                                        Internal URLs usually point to a local container port.
                                    </>
                                }
                                placement="top-start"
                            />
                        </Typography>
                    </Stack>

                    <Typography variant={'body2'}></Typography>

                    {internal.length ? (
                        internal.map(({ id: blockId, definition, status, instance, url }) => {
                            return (
                                <GatewayCard
                                    key={blockId}
                                    title={instance.name || definition.metadata.title || definition.metadata.name}
                                    loading={status === InstanceStatus.STARTING || status === InstanceStatus.STOPPING}
                                    fallbackText="Open on localhost"
                                    fallback={{
                                        url: url || null,
                                        status: status === InstanceStatus.READY ? 'ok' : undefined,
                                    }}
                                    onConfigureGateway={() => {
                                        props.onConfigure({ block: definition, instance });
                                    }}
                                />
                            );
                        })
                    ) : props.readOnly ? (
                        <Typography variant={'body2'}>No internal URLs available for this plan.</Typography>
                    ) : (
                        <Typography variant={'body2'}>
                            No internal URLs yet. Add internal URLs to the plan by adding blocks.
                        </Typography>
                    )}
                </Stack>
            </Stack>
        );
    },
    {
        fallback: <div>Failed to render Gateways.</div>,
    }
);
