/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useEffect, useState } from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import { useLocation, useNavigate, Location, useNavigationType } from 'react-router-dom';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import HistoryIcon from '@mui/icons-material/History';
import { TOP_BAR_ICON_BUTTON_STYLE } from './types';

export const NavigationButtons = () => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const navigate = useNavigate();

    const [locationHistory, setLocationHistory] = useState({
        history: [] as Location[],
        idx: -1,
    });

    const back = () => navigate(-1);
    const hasPrevious = locationHistory.idx > 0;
    const forward = () => navigate(1);
    const hasNext = locationHistory.idx < locationHistory.history.length - 1;

    useEffect(() => {
        setLocationHistory((state) => {
            try {
                const newIndex = {
                    PUSH: state.idx + 1,
                    REPLACE: state.idx,
                    // Handle initial route by forcing 0
                    POP: Math.max(
                        state.history.findIndex((l) => l.key === location.key),
                        0
                    ),
                }[navigationType];
                const newHistory =
                    navigationType === 'PUSH' ? state.history.slice(0, state.idx + 1) : [...state.history];
                newHistory[newIndex] = location;

                return {
                    history: newHistory,
                    idx: newIndex,
                };
            } catch (e) {
                console.error(e);
                return state;
            }
        });
    }, [location, navigationType]);

    return (
        <Stack
            direction={'row'}
            justifyContent={'end'}
            alignItems={'center'}
            sx={{
                height: '40px',
                padding: '0 16px',
            }}
            className="allow-drag-app"
        >
            <IconButton
                onClick={back}
                disabled={!hasPrevious}
                className={hasPrevious ? 'disallow-drag-app' : ''}
                size="small"
                sx={TOP_BAR_ICON_BUTTON_STYLE}
            >
                <ArrowBack />
            </IconButton>
            <IconButton
                onClick={forward}
                disabled={!hasNext}
                className={hasNext ? 'disallow-drag-app' : ''}
                size="small"
                sx={TOP_BAR_ICON_BUTTON_STYLE}
            >
                <ArrowForward />
            </IconButton>

            {/* <IconButton
                disabled
                // TODO: disallow dragging when button is active
                size="small"
                sx={{ ...TOP_BAR_ICON_BUTTON_STYLE, ml: 2 }}
            >
                <HistoryIcon />
            </IconButton> */}
        </Stack>
    );
};
