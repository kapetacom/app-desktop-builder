import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';

export const NavigationButtons = (props) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [locationHistory, setLocationHistory] = useState({
        history: [],
        idx: -1,
    });

    const back = () => navigate(-1);
    const hasPrevious = locationHistory.idx > 0;
    const forward = () => navigate(1);
    const hasNext = locationHistory.idx < locationHistory.history.length - 1;

    useEffect(() => {
        // Current location is not in history
        setLocationHistory((state) => {
            const isSameLocation = (a, b) => a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;
            const historyBeforeCurrent = state.idx >= 0 ? state.history.slice(0, state.idx + 1) : state.history;
            const existingIndex = state.history.findIndex((l) => isSameLocation(l, location));
            return existingIndex >= 0
                ? {
                      history: state.history,
                      idx: existingIndex,
                  }
                : { idx: state.history.length, history: [...historyBeforeCurrent, location] };
        });
    }, [location]);

    return (
        <Stack
            direction={'row'}
            justifyContent={'end'}
            sx={{
                height: '40px',
                marginTop: '-40px',
            }}
        >
            {/* Make the empty space draggable */}
            <Box sx={{ flexGrow: 1, '-webkit-app-region': 'drag', '-webkit-user-select': 'none' }} />
            <IconButton onClick={back} disabled={!hasPrevious} size="small">
                <ArrowBack />
            </IconButton>
            <IconButton onClick={forward} disabled={!hasNext} size="small">
                <ArrowForward />
            </IconButton>
        </Stack>
    );
};
