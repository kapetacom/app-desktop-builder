import React from 'react';

import './index.less';
import {ThemeProvider} from '@mui/material';
import {kapetaLight} from '../src/renderer/Theme';
import {PlanOverview} from "../src/renderer/components/plan-overview/PlanOverview";
import {Asset} from "@kapeta/ui-web-types";
import {Plan} from "@kapeta/schemas";

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
    }
}

const SAMPLE_PLAN: Asset<Plan> = {
    ...defaultInfo,
    version: '1.0.0',
    ref: 'kapeta/sample-plan',
    data: {
        ...defaultData,
        metadata: {
            name: 'kapeta/sample-plan',
            title: 'Sample Plan'
        }
    }
};

export default {
    title: 'Plan Overview',
};

export const EmptyState = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <div style={{maxWidth: '1152px'}}>
                <PlanOverview
                    onPlanSelected={(plan) => {
                        console.log('onPlanSelected', plan)
                    }}
                    onPlanAdded={(plan) => {
                        console.log('onPlanAdded', plan)
                    }}
                    onPlanRemoved={(plan) => {
                        console.log('onPlanRemoved', plan)
                    }}
                    sample={SAMPLE_PLAN} plans={[]}/>
            </div>
        </ThemeProvider>
    );
};


export const EmptyNoSampleState = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <div style={{maxWidth: '1152px'}}>
                <PlanOverview
                    onPlanSelected={(plan) => {
                        console.log('onPlanSelected', plan)
                    }}
                    onPlanAdded={(plan) => {
                        console.log('onPlanAdded', plan)
                    }}
                    onPlanRemoved={(plan) => {
                        console.log('onPlanRemoved', plan)
                    }}
                    plans={[]}/>
            </div>
        </ThemeProvider>
    );
};
export const FilledState = () => {
    return (
        <ThemeProvider theme={kapetaLight}>
            <div style={{maxWidth: '1152px'}}>
                <PlanOverview sample={SAMPLE_PLAN}
                              onPlanSelected={(plan) => {
                                  console.log('onPlanSelected', plan)
                              }}
                              onPlanAdded={(plan) => {
                                  console.log('onPlanAdded', plan)
                              }}
                              onPlanRemoved={(plan) => {
                                  console.log('onPlanRemoved', plan)
                              }}
                              plans={[
                                  {
                                      ...defaultInfo,
                                      version: '1.0.0',
                                      ref: 'kapeta/test:1.0.0',
                                      data: {
                                          ...defaultData,
                                          metadata: {
                                              name: 'kapeta/test',
                                              title: 'Test Plan'
                                          }
                                      }
                                  },
                                  {
                                      ...defaultInfo,
                                      version: '1.0.0',
                                      ref: 'kapeta/todo:1.0.0',
                                      data: {
                                          ...defaultData,
                                          metadata: {
                                              name: 'kapeta/todo',
                                              title: 'Todo System'
                                          }
                                      }
                                  },
                                  {
                                      ...defaultInfo,
                                      version: '1.0.0',
                                      ref: 'kapeta/projects:1.0.0',
                                      data: {
                                          ...defaultData,
                                          metadata: {
                                              name: 'kapeta/projects',
                                              title: 'Project Management'
                                          }
                                      }
                                  },
                                  {
                                      ...defaultInfo,
                                      version: '1.0.0',
                                      ref: 'kapeta/payments:1.0.0',
                                      data: {
                                          ...defaultData,
                                          metadata: {
                                              name: 'kapeta/payments',
                                              title: 'Payment System'
                                          }
                                      }
                                  }
                              ]}/>
            </div>
        </ThemeProvider>
    );
};
