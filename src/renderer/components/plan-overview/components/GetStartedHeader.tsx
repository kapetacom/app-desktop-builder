/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import AddIcon from '../../shell/components/icons/large/AddIcon.svg';
import ImportIcon from '../../shell/components/icons/large/ImportIcon.svg';
import BlockHubIcon from '../../shell/components/icons/large/BlockHubIcon.svg';
import { useKapetaContext } from '../../../hooks/contextHook';
import { AssetImporter } from '../../../utils/useAssetImporter';

interface XLButtonProps {
    variant: 'edit' | 'blockhub' | 'import';
    label: string;
    processing?: boolean;
    onClick?: () => void;
}

const XLButton = (props: XLButtonProps) => {
    let icon,
        color = 'primary.contrastText',
        bgColor,
        bgColorHover,
        border,
        borderHover;

    switch (props.variant) {
        case 'blockhub':
            icon = <BlockHubIcon />;
            color = 'white';
            bgColor = '#455A64';
            bgColorHover = '#263238';
            break;
        case 'edit':
            icon = <AddIcon />;
            color = 'white';
            bgColor = 'primary.main';
            bgColorHover = 'primary.dark';
            break;
        case 'import':
            icon = <ImportIcon />;
            color = '#455A64';
            border = '1px dashed #455A64';
            borderHover = '1px dashed primary.main';
            break;
    }

    if (props.processing) {
        icon = <CircularProgress size={36} />;
    }

    return (
        <Button
            className={'xl-button'}
            onClick={props.onClick}
            sx={{
                border,
                display: 'block',
                borderRadius: '10px',
                width: '100%',
                padding: '20px 16px',
                height: '110px',
                bgcolor: bgColor,
                color,
                textAlign: 'center',

                '&:hover': {
                    bgcolor: bgColorHover,
                    border: borderHover,
                    boxShadow: 3,
                },
            }}
        >
            {icon}
            <Typography color={'inherit'}>{props.label}</Typography>
        </Button>
    );
};

interface Props {
    onPlanCreate?: () => void;
    onPlanImport?: () => void;
    assetImporter: AssetImporter;
}

export const GetStartedHeader = (props: Props) => {
    const kapetaContext = useKapetaContext();

    return (
        <Stack>
            <Typography variant={'h6'} pb={2}>
                Get started
            </Typography>
            <Stack
                direction={'row'}
                sx={{
                    '.xl-button': {
                        flex: 1,
                    },
                    gap: 3,
                }}
            >
                <XLButton variant={'edit'} label={'New Plan'} onClick={props.onPlanCreate} />
                <XLButton variant={'blockhub'} label={'Block Hub'} onClick={() => kapetaContext.blockHub.open()} />
                <XLButton
                    variant={'import'}
                    label={'Import'}
                    processing={props.assetImporter.loading}
                    onClick={props.onPlanImport}
                />
            </Stack>
        </Stack>
    );
};
