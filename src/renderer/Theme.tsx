import React from 'react';
import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { LinkProps } from '@mui/material/Link';
import { lightTheme, darkTheme } from '@kapeta/style';
import { createTheme } from '@mui/material';

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

export const kapetaDark = createTheme(
    darkTheme,
    /**
     * Patch MUI to use react-router links
     */

    {
        components: {
            MuiLink: {
                //@ts-ignore
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

export const kapetaLight = createTheme(
    lightTheme,
    /**
     * Patch MUI to use react-router links
     */

    {
        components: {
            MuiLink: {
                //@ts-ignore
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
