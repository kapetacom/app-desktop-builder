import { GatewayCard, PlannerContext } from '@kapeta/ui-web-plan-editor';
import { Badge, Chip, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { withErrorBoundary } from 'react-error-boundary';
import { Tooltip as KapTooltip } from '@kapeta/ui-web-components';
import { useContext } from 'react';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import { BlockDefinition } from '@kapeta/schemas';
import { InstanceStatus } from '@kapeta/ui-web-context';
import { InfoOutlined } from '@mui/icons-material';
import { BlockInstance } from '@kapeta/schemas';
import { BlockInfo } from '../types';
import { useEffect } from 'react';
import { useAsyncRetry } from 'react-use';
import { InstanceService } from '../../../api/InstanceService';

interface PlannerGatewaysListProps {
    /**
     * System id / plan id
     */
    systemId: string;
    onConfigure: (info: BlockInfo) => void;
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
                        public: parseKapetaUri(definition?.kind).fullName === 'kapeta/block-type-gateway-http',
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
            <Stack gap={3} sx={{ py: 1 }}>
                <Stack gap={1.5} sx={{ py: 2 }}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Typography variant={'h3'} fontSize={'14px'} fontWeight={700}>
                            Public URLs
                        </Typography>
                        <KapTooltip
                            title={
                                <>
                                    Public URLs for Gateways in your plan. Gateways will get a <b>kapeta.dev</b> URL in
                                    cloud environments.
                                    <br />
                                    <br />
                                    Public URLs can be configured for <b>custom domains in the gateway settings</b>.
                                </>
                            }
                            placement="top-start"
                        >
                            <InfoOutlined fontSize={'small'} sx={{ ml: 0.5 }} />
                        </KapTooltip>
                    </Stack>

                    {gateways
                        .filter((block) => block.public)
                        .map(({ id: blockId, definition, status, instance, url }) => {
                            return (
                                <GatewayCard
                                    key={blockId}
                                    status={status}
                                    title={instance.name || definition.metadata.title || definition.metadata.name}
                                    fallback={{
                                        url: url || null,
                                    }}
                                    onConfigureGateway={() => {
                                        props.onConfigure({ block: definition, instance });
                                    }}
                                />
                            );
                        })}
                </Stack>

                <Stack gap={1.5}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Typography variant={'h3'} fontSize={'14px'} fontWeight={700}>
                            Internal URLs
                        </Typography>
                        <KapTooltip
                            title={
                                <>
                                    Internal URLs will show for running blocks during local development, and are{' '}
                                    <b>not available in cloud environments</b>. <br />
                                    <br />
                                    Internal URLs usually point to a local container port.
                                </>
                            }
                            placement="top-start"
                        >
                            <InfoOutlined fontSize={'small'} sx={{ ml: 0.5 }} />
                        </KapTooltip>
                    </Stack>

                    <Typography variant={'body2'}></Typography>

                    {internal.map(({ id: blockId, definition, status, instance, url }) => {
                        return (
                            <GatewayCard
                                key={blockId}
                                status={status}
                                title={instance.name || definition.metadata.title || definition.metadata.name}
                                fallbackText="Open on localhost"
                                fallback={{
                                    url: url || null,
                                }}
                                onConfigureGateway={() => {
                                    props.onConfigure({ block: definition, instance });
                                }}
                            />
                        );
                    })}
                </Stack>
            </Stack>
        );
    },
    {
        fallback: <div>Failed to render Gateways.</div>,
    }
);