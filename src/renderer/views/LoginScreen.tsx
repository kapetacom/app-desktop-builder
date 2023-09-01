import { Box, Button, CircularProgress, Link, Paper, Stack, ThemeProvider, Typography } from '@mui/material';
import { Logo } from '../components/shell/components/KapetaLogo';
import { kapetaLight } from '../Theme';
import { useState } from 'react';

interface LoginResult {
    success: boolean;
    error?: string;
}

interface Props {
    onClickLogin: () => Promise<LoginResult>;
    onLoggedIn?: () => void;
}

export const LoginScreen = (props: Props) => {
    const [loggingIn, setLoggingIn] = useState(false);
    const [error, setError] = useState<string>();

    return (
        <Stack
            direction={'row'}
            sx={{
                '-webkit-app-region': 'drag',
                cursor: 'move',
            }}
            justifyContent={'center'}
            width={'100%'}
            height={'100%'}
            alignItems={'center'}
        >
            <ThemeProvider theme={kapetaLight}>
                <Box>
                    <Stack direction={'column'} gap={4} alignItems={'center'}>
                        <Logo width={120} />
                        <Typography
                            variant={'h1'}
                            sx={{
                                fontWeight: 400,
                                fontSize: '48px',
                            }}
                        >
                            Log in to Kapeta
                        </Typography>
                        <Box position={'relative'}>
                            <Button
                                sx={{
                                    '-webkit-app-region': 'no-drag',
                                }}
                                variant={loggingIn ? 'outlined' : 'contained'}
                                size={'large'}
                                onClick={async () => {
                                    setLoggingIn(true);
                                    setError(undefined);
                                    try {
                                        const result = await props.onClickLogin();
                                        setError(result.error);
                                        if (result.success && props.onLoggedIn) {
                                            props.onLoggedIn();
                                        }
                                    } finally {
                                        setLoggingIn(false);
                                    }
                                }}
                            >
                                {loggingIn ? (
                                    <>
                                        <span>View in Browser</span>
                                        <CircularProgress sx={{ ml: 1 }} size={18} />
                                    </>
                                ) : (
                                    <span>Continue in Browser</span>
                                )}
                            </Button>
                            {error && (
                                <Typography
                                    textAlign={'center'}
                                    component={'p'}
                                    variant={'caption'}
                                    color={'error.main'}
                                    mt={1}
                                >
                                    {error}
                                </Typography>
                            )}
                        </Box>
                        <Typography variant={'caption'}>
                            No account?{' '}
                            <a
                                target={'_blank'}
                                style={{
                                    //@ts-ignore
                                    '-webkit-app-region': 'no-drag',
                                }}
                                href={'https://app.kapeta.com/signup'}
                            >
                                Create one
                            </a>
                        </Typography>
                    </Stack>
                </Box>
            </ThemeProvider>
        </Stack>
    );
};
