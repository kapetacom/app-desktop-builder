import React, { forwardRef, PropsWithChildren, useState } from 'react';
import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { Asset, SchemaKind } from '@kapeta/ui-web-types';
import {
    AssetKindIcon,
    CoreTypes,
    SimpleLoader,
    useConfirm,
} from '@kapeta/ui-web-components';
import {
    BlockPreview,
    BlockTypePreview,
    PlanPreview,
    ResourceTypePreview,
} from '@kapeta/ui-web-plan-editor';
import {
    BlockTypeProvider,
    ResourceTypeProvider,
} from '@kapeta/ui-web-context';
import { useLoadedPlanContext } from '../utils/planContextLoader';
import { Plan } from '@kapeta/schemas';
import { installerService } from '../api/installerService';
import { Delete } from '@mui/icons-material';

const CONTAINER_CLASS = 'asset-thumbnail';

interface InnerProps {
    asset: Asset<SchemaKind>;
    width: number;
    height: number;
    onClick?: (asset: Asset<SchemaKind>) => void;
}

export const AssetThumbnailContainer = forwardRef<
    HTMLDivElement,
    InnerProps & PropsWithChildren
>((props, ref) => {
    const title =
        props.asset.data.metadata.title ?? props.asset.data.metadata.name;

    const [deleting, setDeleting] = useState(false);
    const confirm = useConfirm();

    return (
        <Stack
            ref={ref}
            className={CONTAINER_CLASS}
            onClick={() => props.onClick?.(props.asset)}
            direction={'column'}
            gap={0}
            sx={{
                transition: (theme) =>
                    theme.transitions.create('all', {
                        duration: theme.transitions.duration.short,
                    }),
                cursor: props.onClick ? 'pointer' : undefined,
                width: `${props.width}px`,
                height: `${props.height}px`,
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1ox solid rgba(69, 90, 100, 0.50)',
                bgcolor: '#F4EEEE',
                '&:hover': {
                    boxShadow: 3,
                },
                '& > .preview': {
                    position: 'relative',
                },
            }}
        >
            <Box className={'preview'} flex={1}>
                {installerService.uninstall && (
                    <Chip
                        label={
                            deleting ? (
                                <CircularProgress size={24} />
                            ) : (
                                <Delete />
                            )
                        }
                        variant={'filled'}
                        color={'default'}
                        onClick={async (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (!installerService.uninstall) {
                                return;
                            }
                            try {
                                await confirm({
                                    title: 'Uninstall asset',
                                    content: `
                                    Are you sure you want to uninstall ${title}?
                                    This will not delete anything from your disk.
                                    `,
                                    confirmationText: 'Uninstall',
                                });

                                setDeleting(true);
                                await installerService.uninstall(
                                    props.asset.ref
                                );
                            } catch (e) {
                                // Ignore
                            } finally {
                                setDeleting(false);
                            }
                        }}
                        sx={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            zIndex: 1,
                            border: '1px solid #263238',
                            color: '#263238',
                            '& > .MuiChip-label': {
                                p: '0 4px',
                            },
                            '&:hover': {
                                boxShadow: 2,
                                color: 'error.contrastText',
                                bgcolor: 'error.main',
                            },
                        }}
                    />
                )}
                {props.children}
            </Box>
            <Stack
                className={'metadata'}
                direction={'row'}
                p={2}
                gap={1}
                sx={{
                    bgcolor: '#263238',
                    color: 'white',
                    minHeight: '56px',
                    height: '56px',
                }}
            >
                <AssetKindIcon asset={props.asset.data} size={24} />
                <Box flex={1}>
                    <Typography
                        mb={'4px'}
                        fontSize={18}
                        fontWeight={500}
                        variant={'h6'}
                    >
                        {title}
                    </Typography>
                    <Typography
                        color={'#eeeeee'}
                        fontSize={12}
                        fontWeight={400}
                        variant={'caption'}
                    >
                        {props.asset.version}
                    </Typography>
                </Box>
            </Stack>
        </Stack>
    );
});

const InnerPreview = (props: InnerProps) => {
    const kind = props.asset.data.kind;
    try {
        switch (kind) {
            case CoreTypes.PLAN:
                const context = useLoadedPlanContext(props.asset.data as Plan);
                return (
                    <SimpleLoader loading={context.loading}>
                        {!context.loading && (
                            <PlanPreview
                                asset={props.asset}
                                width={props.width}
                                height={props.height}
                                blocks={context.blocks}
                            />
                        )}
                    </SimpleLoader>
                );
            case CoreTypes.BLOCK_TYPE:
            case CoreTypes.BLOCK_TYPE_OPERATOR:
                return (
                    <BlockTypePreview
                        width={props.width}
                        height={props.height}
                        blockType={BlockTypeProvider.get(props.asset.ref)}
                    />
                );
            case CoreTypes.PROVIDER_INTERNAL:
            case CoreTypes.PROVIDER_OPERATOR:
            case CoreTypes.PROVIDER_EXTENSION:
                return (
                    <ResourceTypePreview
                        width={props.width}
                        height={props.height}
                        resourceType={ResourceTypeProvider.get(props.asset.ref)}
                    />
                );
            default:
                if (kind.startsWith('core/')) {
                    return (
                        <AssetKindIcon
                            size={Math.min(props.width, props.height)}
                            asset={props.asset.data}
                        />
                    );
                }

                return (
                    <BlockPreview
                        width={props.width}
                        height={props.height}
                        resources={true}
                        block={props.asset.data}
                        blockType={BlockTypeProvider.get(props.asset.data.kind)}
                    />
                );
        }
    } catch (e) {
        console.warn('Failed to render preview', e);
        return (
            <AssetKindIcon
                size={Math.min(props.width, props.height)}
                asset={props.asset.data}
            />
        );
    }
};

interface Props extends InnerProps {
    hideMetadata?: boolean;
}

export const AssetThumbnail = forwardRef<HTMLDivElement, Props>(
    (props, ref) => {
        if (props.hideMetadata) {
            return (
                <Box
                    ref={ref}
                    className={CONTAINER_CLASS}
                    sx={{
                        position: 'relative',
                        textAlign: 'center',
                    }}
                >
                    <InnerPreview {...props} height={props.height} />
                </Box>
            );
        }
        return (
            <AssetThumbnailContainer ref={ref} {...props}>
                <InnerPreview {...props} height={props.height - 88} />
            </AssetThumbnailContainer>
        );
    }
);
