/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React, { useEffect, useState } from 'react';

import { LoginScreen } from '../src/renderer/views/LoginScreen';
import './index.less';
import { MemoryRouter } from 'react-router-dom';
import { DefaultContext } from '@kapeta/ui-web-components';

export default {
    title: 'Log In Screen',
};

export const LogInSuccess = () => {
    return (
        <DefaultContext>
            <MemoryRouter>
                <LoginScreen
                    onClickLogin={() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ success: true });
                            }, 2000);
                        });
                    }}
                    onLoggedIn={() => {
                        console.log('Logged in');
                    }}
                />
            </MemoryRouter>
        </DefaultContext>
    );
};

export const LogInFail = () => {
    return (
        <DefaultContext>
            <MemoryRouter>
                <LoginScreen
                    onClickLogin={() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ success: false, error: 'Something went wrong' });
                            }, 2000);
                        });
                    }}
                    onLoggedIn={() => {
                        console.log('Logged in');
                    }}
                />
            </MemoryRouter>
        </DefaultContext>
    );
};

export const LongLoading = () => {
    return (
        <DefaultContext>
            <MemoryRouter>
                <LoginScreen
                    onClickLogin={() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve({ success: false, error: 'Something went wrong' });
                            }, 6000000);
                        });
                    }}
                    onLoggedIn={() => {
                        console.log('Logged in');
                    }}
                />
            </MemoryRouter>
        </DefaultContext>
    );
};
