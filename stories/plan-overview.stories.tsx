/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import React from 'react';

import './index.less';
import { ThemeProvider } from '@mui/material';
import { kapetaLight } from '../src/renderer/Theme';
import { PlanOverview } from '../src/renderer/components/plan-overview/PlanOverview';
import { Plan } from '@kapeta/schemas';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import { ConfirmProvider } from '@kapeta/ui-web-components';
import { AssetStore } from '@kapeta/ui-web-context';
import { Asset, SchemaKind } from '@kapeta/ui-web-types';

const defaultInfo = {
    ymlPath: '',
    path: '',
    editable: true,
    kind: 'core/plan',
    exists: true,
};

const defaultData = {
    kind: 'core/plan',
    spec: {
        blocks: [],
        configuration: {},
        connections: [],
    },
};

const SAMPLE_PLAN: AssetInfo<Plan> = {
    ...defaultInfo,
    version: '1.0.0',
    ref: 'kapeta/sample-plan',
    content: {
        ...defaultData,
        metadata: {
            name: 'kapeta/sample-plan',
            title: 'Sample Plan',
        },
    },
};

const assetService: AssetStore = {
    list: () => Promise.resolve([]),
    get: (ref: string, ensure: boolean) => Promise.resolve({} as Asset),
    import: (ref: string) => Promise.resolve([]),
    create: (path: string, content: SchemaKind) => Promise.resolve([]),
    remove: (ref: string) => Promise.resolve(),
};

export default {
    title: 'Plan Overview',
};

export const EmptyState = () => {
    return (
        <ConfirmProvider>
            <ThemeProvider theme={kapetaLight}>
                <div style={{ maxWidth: '1152px' }}>
                    <PlanOverview
                        assetService={assetService}
                        onPlanSelected={(plan) => {
                            console.log('onPlanSelected', plan);
                        }}
                        onPlanAdded={(plan) => {
                            console.log('onPlanAdded', plan);
                        }}
                        onPlanRemoved={(plan) => {
                            console.log('onPlanRemoved', plan);
                        }}
                        onPlanImported={(plan) => {
                            console.log('onPlanImported', plan);
                        }}
                        samplePlanName={SAMPLE_PLAN.content.metadata.name}
                        plans={[SAMPLE_PLAN]}
                    />
                </div>
            </ThemeProvider>
        </ConfirmProvider>
    );
};

export const EmptyNoSampleState = () => {
    return (
        <ConfirmProvider>
            <ThemeProvider theme={kapetaLight}>
                <div style={{ maxWidth: '1152px' }}>
                    <PlanOverview
                        assetService={assetService}
                        onPlanSelected={(plan) => {
                            console.log('onPlanSelected', plan);
                        }}
                        onPlanAdded={(plan) => {
                            console.log('onPlanAdded', plan);
                        }}
                        onPlanRemoved={(plan) => {
                            console.log('onPlanRemoved', plan);
                        }}
                        onPlanImported={(plan) => {
                            console.log('onPlanImported', plan);
                        }}
                        plans={[]}
                    />
                </div>
            </ThemeProvider>
        </ConfirmProvider>
    );
};
export const FilledState = () => {
    return (
        <ConfirmProvider>
            <ThemeProvider theme={kapetaLight}>
                <div style={{ maxWidth: '1152px' }}>
                    <PlanOverview
                        assetService={assetService}
                        samplePlanName={SAMPLE_PLAN.content.metadata.name}
                        onPlanSelected={(plan) => {
                            console.log('onPlanSelected', plan);
                        }}
                        onPlanAdded={(plan) => {
                            console.log('onPlanAdded', plan);
                        }}
                        onPlanRemoved={(plan) => {
                            console.log('onPlanRemoved', plan);
                        }}
                        onPlanImported={(plan) => {
                            console.log('onPlanImported', plan);
                        }}
                        plans={[
                            {
                                ...defaultInfo,
                                version: '1.0.0',
                                ref: 'kapeta/test:1.0.0',
                                content: {
                                    ...defaultData,
                                    metadata: {
                                        name: 'kapeta/test',
                                        title: 'Test Plan',
                                    },
                                },
                            },
                            {
                                ...defaultInfo,
                                version: '1.0.0',
                                ref: 'kapeta/todo:1.0.0',
                                content: {
                                    ...defaultData,
                                    metadata: {
                                        name: 'kapeta/todo',
                                        title: 'Todo System',
                                    },
                                },
                            },
                            {
                                ...defaultInfo,
                                version: '1.0.0',
                                ref: 'kapeta/projects:1.0.0',
                                content: {
                                    ...defaultData,
                                    metadata: {
                                        name: 'kapeta/projects',
                                        title: 'Project Management',
                                    },
                                },
                            },
                            {
                                ...defaultInfo,
                                version: '1.0.0',
                                ref: 'kapeta/payments:1.0.0',
                                content: {
                                    ...defaultData,
                                    metadata: {
                                        name: 'kapeta/payments',
                                        title: 'Payment System',
                                    },
                                },
                            },
                        ]}
                    />
                </div>
            </ThemeProvider>
        </ConfirmProvider>
    );
};
