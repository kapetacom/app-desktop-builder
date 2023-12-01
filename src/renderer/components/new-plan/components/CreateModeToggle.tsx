import React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material';

export type CreateMode = 'ai' | 'manual';

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
    // Beats MUI specificity
    '&&&': {
        border: 'none',
        borderRadius: '8px',
        textTransform: 'none',
        padding: theme.spacing(1, 2),
        '&.Mui-selected': {
            backgroundColor: '#455A64',
            color: theme.palette.primary.contrastText,
            '&:hover': {
                backgroundColor: '#263238',
            },
        },
        '& > svg': {
            marginRight: theme.spacing(1),
        },
    },
}));

interface CreateModeToggleProps {
    createMode: CreateMode;
    onChange: (createMode: CreateMode) => void;
}

export default function CreateModeToggle(props: CreateModeToggleProps) {
    const { createMode, onChange } = props;

    return (
        <ToggleButtonGroup
            exclusive
            value={createMode}
            onChange={(event: React.MouseEvent<HTMLElement>, newMode: CreateMode) => {
                if (newMode !== null) {
                    onChange(newMode);
                }
            }}
            aria-label="Create plan mode"
            sx={{
                p: 0.5,
                backgroundColor: (theme) => theme.palette.grey[300],
                borderRadius: '12px',
            }}
            size="small"
        >
            <StyledToggleButton value="ai" aria-label="AI Builder">
                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10.1406 9.39359C9.84585 9.39359 9.6069 9.15464 9.6069 8.85988C9.6069 8.56512 9.84585 8.32617 10.1406 8.32617C10.4354 8.32617 10.6743 8.56512 10.6743 8.85988C10.6743 9.15464 10.4354 9.39359 10.1406 9.39359Z"
                        fill="white"
                    />
                    <path
                        d="M18.4663 4.26966C16.9949 4.26966 15.7978 5.46677 15.7978 6.9382C15.7978 7.23292 15.5588 7.47191 15.264 7.47191C14.9693 7.47191 14.7303 7.23292 14.7303 6.9382C14.7303 5.46677 13.5332 4.26966 12.0618 4.26966C11.7671 4.26966 11.5281 4.03067 11.5281 3.73595C11.5281 3.44124 11.7671 3.20225 12.0618 3.20225C13.5332 3.20225 14.7303 2.00514 14.7303 0.533708C14.7303 0.238994 14.9693 0 15.264 0C15.5588 0 15.7978 0.238994 15.7978 0.533708C15.7978 2.00514 16.9949 3.20225 18.4663 3.20225C18.761 3.20225 19 3.44124 19 3.73595C19 4.03067 18.761 4.26966 18.4663 4.26966ZM15.264 2.4557C14.9484 2.97969 14.5078 3.42027 13.9838 3.73595C14.5078 4.05164 14.9484 4.49222 15.264 5.01621C15.5797 4.49222 16.0203 4.05164 16.5443 3.73595C16.0203 3.42027 15.5797 2.97969 15.264 2.4557Z"
                        fill="white"
                    />
                    <path
                        d="M0.533867 13.1295C2.88816 13.1295 4.80353 11.2142 4.80353 8.85988C4.80353 8.56517 5.04252 8.32617 5.33724 8.32617C5.63195 8.32617 5.87095 8.56517 5.87095 8.85988C5.87095 11.2142 7.78632 13.1295 10.1406 13.1295C10.4353 13.1295 10.6743 13.3685 10.6743 13.6633C10.6743 13.958 10.4353 14.197 10.1406 14.197C7.78632 14.197 5.87095 16.1123 5.87095 18.4666C5.87095 18.7613 5.63195 19.0003 5.33724 19.0003C5.04252 19.0003 4.80353 18.7613 4.80353 18.4666C4.80353 16.1123 2.88816 14.197 0.533867 14.197C0.239154 14.197 0.000159264 13.958 0.000159264 13.6633C0.000159264 13.3685 0.239154 13.1295 0.533867 13.1295ZM5.33724 16.1415C5.86118 15.0635 6.73747 14.1872 7.81551 13.6633C6.73747 13.1393 5.86118 12.263 5.33724 11.185C4.8133 12.263 3.937 13.1393 2.85897 13.6633C3.937 14.1872 4.8133 15.0635 5.33724 16.1415Z"
                        fill="white"
                    />
                    <path
                        d="M5.33734 0C5.63205 0 5.87104 0.238994 5.87104 0.533708V1.60112H6.93846C7.23317 1.60112 7.47217 1.84012 7.47217 2.13483C7.47217 2.42954 7.23317 2.66854 6.93846 2.66854H5.87104V3.73595C5.87104 4.03067 5.63205 4.26966 5.33734 4.26966C5.04262 4.26966 4.80363 4.03067 4.80363 3.73595V2.66854H3.73621C3.4415 2.66854 3.20251 2.42954 3.20251 2.13483C3.20251 1.84012 3.4415 1.60112 3.73621 1.60112H4.80363V0.533708C4.80363 0.238994 5.04262 0 5.33734 0Z"
                        fill="white"
                    />
                </svg>{' '}
                AI Builder
            </StyledToggleButton>
            <StyledToggleButton value="manual" aria-label="Manual Builder">
                Manual Builder
            </StyledToggleButton>
        </ToggleButtonGroup>
    );
}
