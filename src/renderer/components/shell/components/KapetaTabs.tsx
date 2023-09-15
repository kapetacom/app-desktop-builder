import { Tab, Tabs } from '@mui/material';
import { lightTheme } from '@kapeta/style';
import { createStyled } from '@mui/system';

export type KapetaTabsType = 'deploy' | 'edit';
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
    ({ variant, theme }: { variant?: 'deploy' | 'edit'; theme: any }) => {
        const bg =
            variant &&
            {
                deploy: theme.tabs.deployFill,
                edit: theme.tabs.editFill,
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
