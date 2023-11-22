/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';
import { Box } from '@mui/material';

export const Ribbon = (props: React.PropsWithChildren) => {
    return (
        <Box
            sx={{
                overflow: 'hidden',
                width: '70px',
                height: '70px',
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                '::before': {
                    position: 'absolute',
                    zIndex: -1,
                    content: '""',
                    display: 'block',
                    border: '5px solid #2980b9',
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    top: 0,
                    left: 0,
                },
                '::after': {
                    position: 'absolute',
                    zIndex: -1,
                    content: '""',
                    display: 'block',
                    border: '5px solid #2980b9',
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    bottom: 0,
                    right: 0,
                },
                '& > span': {
                    position: 'absolute',
                    display: 'block',
                    width: '100px',
                    padding: '10px 0',
                    fontSize: '12px',
                    backgroundColor: '#3498db',
                    boxShadow: '0 5px 10px rgba(0,0,0,.1)',
                    color: '#fff',
                    textShadow: '0 1px 1px rgba(0,0,0,.2)',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    left: '-2px',
                    top: '8px',
                    transform: 'rotate(45deg)',
                },
            }}
        >
            <span>{props.children}</span>
        </Box>
    );
};
