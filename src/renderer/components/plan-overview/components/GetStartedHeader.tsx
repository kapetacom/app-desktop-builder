import React from "react";
import {Button, Stack, Typography} from "@mui/material";
import {CustomIcon} from "../../shell/components/CustomIcon";
import AddIcon from '../../shell/components/icons/large/AddIcon.svg';
import ImportIcon from '../../shell/components/icons/large/ImportIcon.svg';
import BlockHubIcon from '../../shell/components/icons/large/BlockHubIcon.svg';
import {useKapetaContext} from "../../../hooks/contextHook";
interface XLButtonProps {
    variant: 'edit' | 'blockhub' | 'import'
    label: string
    onClick?: () => void
}

const XLButton = (props: XLButtonProps) => {

    let icon,
        color = 'primary.contrastText',
        bgColor,
        bgColorHover,
        border,
        borderHover;

    switch (props.variant) {
        case "blockhub":
            icon = <BlockHubIcon />;
            bgColor = '#455A64';
            bgColorHover = '#263238';
            break;
        case "edit":
            icon = <AddIcon />;
            bgColor = 'primary.main';
            bgColorHover = 'primary.dark';
            break;
        case "import":
            icon = <ImportIcon />;
            color = '#455A64';
            border = '1px dashed #455A64';
            borderHover = '1px dashed primary.main';
            break;
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
                color: color,
                textAlign: 'center',

                '&:hover': {
                    bgcolor: bgColorHover,
                    border: borderHover,
                    boxShadow: 3
                }
            }}>
            {icon}
            <Typography>
                {props.label}
            </Typography>
        </Button>
    )
}

interface Props {
    onPlanCreate?: () => void
    onPlanImport?: () => void
}

export const GetStartedHeader = (props:Props) => {
    const kapetaContext = useKapetaContext();

    return (
        <Stack direction={'column'} sx={{
            pt: 2,
            pb: 2,
        }}>
            <Typography variant={'h6'} pb={2} pt={2}>
                Get started
            </Typography>
            <Stack
                direction={'row'}
                sx={{
                    '.xl-button': {
                        flex: 1,
                    },
                    gap: 3
                }}
                >
                <XLButton
                    variant={"edit"}
                    label={'New Plan'}
                    onClick={props.onPlanCreate}
                />
                <XLButton
                    variant={"blockhub"}
                    label={'Block Hub'}
                    onClick={() => kapetaContext.blockHub.open()}
                />
                <XLButton
                    variant={"import"}
                    label={'Import'}
                    onClick={props.onPlanImport}
                />
            </Stack>
        </Stack>
    )
}
