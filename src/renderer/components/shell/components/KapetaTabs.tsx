/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Tab, Tabs } from '@mui/material';
import { lightTheme } from '@kapeta/style';
import { createStyled } from '@mui/system';

export type KapetaTabsType = 'deploy' | 'metrics' | 'edit' | 'new-plan';
/**
 * Example of a custom tab component
 */
const styled = createStyled<typeof lightTheme>({
    defaultTheme: lightTheme,
});
export const KapetaTab = styled(Tab, {
    name: 'KapetaTab',
    slot: 'Root',
    shouldForwardProp(propName) {
        return propName !== 'variant';
    },
})<{ variant: KapetaTabsType; href: string }>(
    {
        minHeight: '40px',
        maxHeight: '40px',
        maxWidth: '360px',
        textTransform: 'none',
        justifyContent: 'stretch',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    },
    ({ variant, theme }: { variant?: KapetaTabsType; theme: any }) => {
        const bg =
            variant &&
            {
                deploy: theme.tabs.deployFill,
                edit: theme.tabs.editFill,
                'new-plan': theme.tabs.deployFill,
                metrics: theme.tabs.deployFill,
            }[variant];

        return {
            // Disabled to make active tab more visible
            // '&.MuiTab-root': {
            //     backgroundColor: bg?.enabled,
            //     color: theme.tabs.text.enabled,
            // },
            '& .asset-icon': {
                marginRight: '8px',
            },
            '&.Mui-selected': {
                backgroundColor: bg?.active,
                color: theme.tabs.text.active,
            },
            '&:hover': {
                backgroundColor: bg?.enabled,
                color: theme.tabs.text.active,
            },
        };
    }
);

export const KapetaTabs = styled(Tabs)({
    '& .MuiTabs-indicator': {
        display: 'none',
    },
    '& .MuiTabScrollButton-root.Mui-disabled': {
        display: 'none',
    },
    '&.MuiTabs-root': {
        minHeight: 'auto',
    },
});
