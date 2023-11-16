/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useEffect, useState } from 'react';
import { NoticeModal } from '../../general/NoticeModal';
import { Update, usePlanUpdater } from '../../../hooks/updaterHooks';
import { Alert, AlertTitle, Badge, Box, Button, Stack, Typography } from '@mui/material';

import UpdateIcon from '../../../../../assets/images/update-icon.svg';
import { KapDialog, KindIcon } from '@kapeta/ui-web-components';
import { normalizeKapetaUri } from '@kapeta/nodejs-utils';

interface Props {
    planUpdater: ReturnType<typeof usePlanUpdater>;
}

interface OpenProps {
    open: boolean;
    onClose: () => void;
}

export const PlanUpdaterModal = (props: Props) => {
    const planUpdater = props.planUpdater;
    const [noticeOpen, setNoticeOpen] = React.useState(false);

    useEffect(() => {
        if (planUpdater.prompt) {
            setNoticeOpen(true);
        }
    }, [planUpdater.prompt]);

    if (planUpdater.updates.length === 0) {
        return null;
    }

    return (
        <>
            <PlanUpdaterNotice
                onClose={() => setNoticeOpen(false)}
                open={noticeOpen}
                onReviewOpen={() => {
                    setNoticeOpen(false);
                    planUpdater.showReview();
                }}
                planUpdater={planUpdater}
            />
            <PlanUpdaterReview
                planUpdater={planUpdater}
                onClose={() => planUpdater.hideReview()}
                open={planUpdater.review}
            />
        </>
    );
};

interface UpdaterButtonProps {
    planUpdater: ReturnType<typeof usePlanUpdater>;
    updates: Update[];
    disabled?: boolean;
    ButtonProps?: React.ComponentProps<typeof Button>;
}

const UpdaterButton = (props: UpdaterButtonProps) => {
    const [processing, setProcessing] = useState(false);

    return (
        <Button
            color={'primary'}
            variant={'outlined'}
            disabled={processing || props.disabled}
            onClick={() => {
                setProcessing(true);
                props.planUpdater.applyUpdates(props.updates);
            }}
            {...props.ButtonProps}
        >
            {processing ? 'Applying...' : `Update`}
        </Button>
    );
};

type ReviewProps = Props & OpenProps;

const PlanUpdaterReview = (props: ReviewProps) => {
    const updateCategories: { [category: string]: Update[] } = {};
    const [updatingAll, setUpdatingAll] = useState(false);

    props.planUpdater.updates.forEach((update) => {
        if (updateCategories[update.referenceType] === undefined) {
            updateCategories[update.referenceType] = [];
        }
        updateCategories[update.referenceType].push(update);
    });

    return (
        <KapDialog open={props.open && props.planUpdater.updates.length > 0} onClose={props.onClose}>
            <KapDialog.Title>Review updates</KapDialog.Title>
            <KapDialog.Content>
                <Alert
                    severity={'info'}
                    sx={{
                        mb: 2,
                    }}
                >
                    Review and apply updates to your plan.
                </Alert>
                {Object.entries(updateCategories).map(([category, updates], ix) => {
                    const assetUpdates: { [fromVersion: string]: Update[] } = {};
                    updates.forEach((update) => {
                        const fromRef = normalizeKapetaUri(`${update.name}:${update.fromVersion}`);
                        if (assetUpdates[fromRef] === undefined) {
                            assetUpdates[fromRef] = [];
                        }
                        assetUpdates[fromRef].push(update);
                    });

                    return (
                        <Box
                            key={category}
                            sx={{
                                mb: 2,
                            }}
                        >
                            <Typography>{category}</Typography>
                            <Stack gap={1} direction={'column'}>
                                {Object.entries(assetUpdates).map(([fromRef, updates], ix) => {
                                    const firstUpdate = updates[0];
                                    const title =
                                        firstUpdate.reference.content.metadata.title ??
                                        firstUpdate.reference.content.metadata.name;
                                    return (
                                        <Stack
                                            key={fromRef}
                                            direction={'row'}
                                            alignItems={'center'}
                                            sx={{
                                                gap: 2,
                                                py: 2,
                                                px: 2,
                                                mt: 1,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            <Badge
                                                invisible={updates.length < 2}
                                                badgeContent={updates.length}
                                                color={'info'}
                                            >
                                                <KindIcon
                                                    size={38}
                                                    kind={firstUpdate.reference.content.kind}
                                                    icon={firstUpdate.reference.content.spec.icon}
                                                    title={title}
                                                />
                                            </Badge>
                                            <Box flex={1}>
                                                <Typography fontSize={'15px'} fontWeight={400}>
                                                    {title}
                                                </Typography>
                                                <Typography fontSize={'12px'} fontWeight={400}>
                                                    {firstUpdate.fromVersion} → {firstUpdate.toVersion}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <UpdaterButton
                                                    disabled={updatingAll}
                                                    planUpdater={props.planUpdater}
                                                    updates={updates}
                                                />
                                            </Box>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </Box>
                    );
                })}
            </KapDialog.Content>
            <KapDialog.Actions>
                <Button color={'tertiary'} onClick={props.onClose}>
                    Dismiss
                </Button>
                <Button
                    color={'primary'}
                    variant={'contained'}
                    disabled={updatingAll}
                    onClick={() => {
                        setUpdatingAll(true);
                        props.planUpdater.applyUpdates();
                        props.onClose();
                    }}
                >
                    {updatingAll ? 'Updating...' : 'Update all'}
                </Button>
            </KapDialog.Actions>
        </KapDialog>
    );
};

type NoticeProps = Props &
    OpenProps & {
        onReviewOpen: () => void;
    };

const PlanUpdaterNotice = (props: NoticeProps) => {
    return (
        <NoticeModal
            open={props.open}
            onClose={props.onClose}
            title={'Updates available'}
            PaperStyle={{
                right: '76px',
                width: '400px',
            }}
            actions={
                <>
                    <Button
                        color={'tertiary'}
                        onClick={() => {
                            props.planUpdater.ignoreUpdates();
                            props.onClose();
                        }}
                    >
                        Dismiss
                    </Button>
                    <Button
                        color={'primary'}
                        onClick={() => {
                            props.onReviewOpen();
                        }}
                    >
                        Review
                    </Button>
                </>
            }
        >
            <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} gap={2}>
                <Box
                    sx={{
                        py: 1,
                        px: 0.5,
                        svg: {
                            width: '52px',
                            height: '100%',
                        },
                    }}
                >
                    <UpdateIcon />
                </Box>
                <Typography>
                    {props.planUpdater.updates.length === 1 && (
                        <>
                            There is <b>{props.planUpdater.updates.length}</b> update available for this plan
                        </>
                    )}
                    {props.planUpdater.updates.length > 1 && (
                        <>
                            There are <b>{props.planUpdater.updates.length}</b> updates available for this plan
                        </>
                    )}

                    {props.planUpdater.updates.length === 0 && <>There are no updates available for this plan</>}
                </Typography>
            </Stack>
        </NoticeModal>
    );
};
