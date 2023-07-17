import { Tab, Tabs } from '@mui/material';
import { lightTheme } from '@kapeta/style/dist/src/themes/mui';
import { createStyled } from '@mui/system';

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
})<{ variant?: 'deploy' | 'edit' }>(
    {
        minHeight: '52px',
    },
    ({ variant, theme }) => {
        const bg =
            variant &&
            {
                deploy: theme.tabs.deployFill,
                edit: theme.tabs.editFill,
            }[variant];

        return {
            '&.MuiTab-root': {
                backgroundColor: bg?.enabled,
                color: theme.tabs.text.enabled,
            },
            '&.Mui-selected': {
                backgroundColor: bg?.active,
                color: theme.tabs.text.active,
            },
            '&:hover': {
                backgroundColor: bg?.active,
                color: theme.tabs.text.active,
            },
        };
    }
);

export const KapetaTabs = styled(Tabs)({
    '& .MuiTabs-indicator': {
        display: 'none',
    },
});
