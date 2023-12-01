/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Box, Typography, keyframes } from '@mui/material';
import SouthIcon from '@mui/icons-material/South';

export interface PromptExamplesProps {
    onClickExample: (text: string) => void;
}

const jumpAnimation = keyframes`
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0);
    }
`;

const PromptExampleBox = (props: { text: string; onClick: (text: string) => void }) => {
    const { text, onClick } = props;
    return (
        <Box
            sx={{
                position: 'relative',
                p: 2,
                borderRadius: 2,
                backgroundColor: '#F5F5F5',
                height: '160px',
                flex: '1 1 0px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                    transform: 'scale(1.02)',
                    '& .Mui-Typography-root': {
                        opacity: 0.8,
                    },
                    '& svg': {
                        opacity: 1,
                        animationPlayState: 'running',
                    },
                },
                // Fade-out effect
                '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'linear-gradient(to bottom, rgba(245, 245, 245, 0), rgba(245, 245, 245, 1))',
                    zIndex: 1,
                },
            }}
            onClick={() => onClick(text)}
        >
            <Typography
                variant="body2"
                sx={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: '8',
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {text}
            </Typography>
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2,
                    transition: 'transform 0.5s ease-in-out',
                }}
            >
                <SouthIcon
                    sx={{
                        opacity: 0.15,
                        transition: 'opacity 0.2s ease-in-out',
                        animationName: `${jumpAnimation}`,
                        animationDuration: '0.5s',
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationFillMode: 'forwards',
                        animationPlayState: 'paused',
                    }}
                />
            </Box>
        </Box>
    );
};

export const PromptExamples = (props: PromptExamplesProps) => {
    const { onClickExample } = props;

    return (
        <Box>
            <Typography variant="h5" component="h3" sx={{ my: 2 }}>
                Examples
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <PromptExampleBox onClick={onClickExample} text="Webshop system for handmade wood furniture" />
                <PromptExampleBox onClick={onClickExample} text="Todo app with reminders" />
                <PromptExampleBox
                    onClick={onClickExample}
                    text="Make a twitter app. It should have users, tweets, comments, user settings, user subscription. Users can like tweets and comment on them. Their comments are also tweets. Users have a settings page where they can change their twitter handle, change password, bio etc. Use a microfrontend architecture. I prefer mongodb. I do not like java."
                />
            </Box>
        </Box>
    );
};
