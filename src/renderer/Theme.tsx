import React from 'react';
import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { LinkProps } from '@mui/material/Link';

// TODO: Fix this import path, and figure out light/dark theme
import { lightTheme, darkTheme } from '@kapeta/style/dist/src/themes/mui';
import { createTheme } from '@mui/material';

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

export const theme = createTheme(
    darkTheme,
    /**
     * Patch MUI to use react-router links
     */
    {
        components: {
            MuiLink: {
                defaultProps: {
                    component: LinkBehavior,
                } as LinkProps,
            },
            MuiButtonBase: {
                defaultProps: {
                    LinkComponent: LinkBehavior,
                    disableRipple: true,
                    disableTouchRipple: true,
                    disableFocusRipple: true,
                },
            },
        },
    }
);
