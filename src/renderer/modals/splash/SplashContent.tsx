import React, { useEffect } from 'react';
import { Paper, Alert, Typography, Button } from '@mui/material';
import LogoSquareDark from '../../../../assets/logo_square_dark.svg';
import LogoTextWhite from '../../../../assets/logo_text_white.svg';
import ImageRocket from '../../../../assets/images/rocket.png';
export enum SplashStatusCheck {
    LOADING = 'LOADING',
    OK = 'OK',
    ERROR = 'ERROR',
}

export const SplashStatusIcon = (props: {
    status: SplashStatusCheck | null;
}) => {
    if (!props.status) {
        return null;
    }
    return {
        [SplashStatusCheck.LOADING]: (
            <i className="fas fa-circle-notch fa-spin"></i>
        ),
        [SplashStatusCheck.OK]: <i className="fas fa-check"></i>,
        [SplashStatusCheck.ERROR]: (
            <i className="fal fa-exclamation-circle"></i>
        ),
    }[props.status];
};

interface Props {
    localClusterStatus: SplashStatusCheck;
    dockerStatus: SplashStatusCheck;
    onQuit: () => void;
    onRetry: () => void;
    onDone?: () => void;
}

const DONE_STATES = [SplashStatusCheck.OK, SplashStatusCheck.ERROR];

export const SplashContent = (props: Props) => {
    const [progress, setProgress] = React.useState(0);

    let text = 'Loading...';
    const done =
        DONE_STATES.includes(props.dockerStatus) &&
        DONE_STATES.includes(props.localClusterStatus);

    let okCount = 0;
    if (props.dockerStatus === SplashStatusCheck.OK) {
        okCount += 1;
    }
    if (props.localClusterStatus === SplashStatusCheck.OK) {
        okCount += 1;
    }

    const hasError = done && okCount < 2;
    const minProgress = okCount * 50;

    useEffect(() => {
        if (okCount === 2) {
            props.onDone && props.onDone();
        }
    }, [okCount, props.onDone]);

    if (done) {
        if (
            props.dockerStatus === SplashStatusCheck.OK &&
            props.localClusterStatus === SplashStatusCheck.OK
        ) {
            text = 'Starting kapeta...';
        }

        if (
            props.dockerStatus === SplashStatusCheck.ERROR ||
            props.localClusterStatus === SplashStatusCheck.ERROR
        ) {
            text = 'Failed...';
        }
    } else {
        if (props.localClusterStatus !== SplashStatusCheck.LOADING) {
            text = 'Checking docker...';
        }

        if (props.dockerStatus !== SplashStatusCheck.LOADING) {
            text = 'Starting cluster...';
        }
    }

    useEffect(() => {
        if (minProgress > progress) {
            setProgress((prevState) => minProgress);
        }

        if (done) {
            return () => {};
        }

        const timer = setInterval(() => {
            setProgress((prevProgress) =>
                prevProgress >= 100
                    ? 100
                    : Math.max(minProgress, prevProgress + 5)
            );
            if (progress >= 100) {
                clearInterval(timer);
            }
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, [done, minProgress, props.dockerStatus, props.localClusterStatus]);

    return (
        <Paper
            elevation={7}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                bgcolor: '#001E36',
                borderRadius: '10px',
                width: 516,
                height: 316,
                display: 'flex',
                '.left': {
                    color: 'white',
                    fontSize: '14px',
                    flex: 1,
                    textAlign: 'center',
                    fontWeight: 400,
                    '.logo': {
                        marginTop: '30px',
                        marginBottom: '-10px',
                    },
                    '.status-list': {
                        textAlign: 'left',
                        lineHeight: '35px',
                        width: '180px',
                        margin: '30px auto 0 auto',
                        '& > div': {
                            i: {
                                marginRight: '5px',
                            },
                        },
                    },
                },
                '.right': {
                    flex: 1,
                    width: 258,
                    position: 'relative',
                    '.gradients': {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                    },
                    '.image-left': {
                        width: 105,
                        zIndex: 2,
                        background:
                            'linear-gradient(91deg, #001E36 0%, rgba(0, 30, 54, 0.00) 100%)',
                    },
                    '.image-right': {
                        width: 33,
                        zIndex: 2,
                        right: 0,
                        borderRadius: 10,
                        opacity: 0.2,
                        background:
                            'linear-gradient(-93deg, #001E36 0%, rgba(0, 30, 54, 0.00) 100%)',
                    },
                    '.image-main': {
                        width: 258,
                        height: 316,
                        zIndex: 3,
                        borderRadius: '10px',
                        background:
                            'radial-gradient(77.64% 97.39% at 21.12% 86.39%, rgba(0, 30, 54, 0.00) 57.66%, rgba(1, 30, 54, 0.42) 100%) no-repeat',
                    },
                    '.image': {
                        width: 258,
                        height: 316,
                        borderRadius: '0px 10px 10px 0px',
                        background: `url(${ImageRocket}) lightgray 0px 0px / 100% 100% no-repeat`,
                    },
                    '.logo': {
                        position: 'absolute',
                        top: 13,
                        right: 13,
                        zIndex: 5,
                    },
                    '.errors': {
                        position: 'absolute',
                        zIndex: 6,
                        padding: '16px',
                        boxSizing: 'border-box',
                        top: '68px',
                        bottom: '46px',
                        right: '46px',
                        width: '197px',
                        color: 'white',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        background: 'rgba(0, 0, 0, 0.70)',
                        boxShadow:
                            '0px 10px 13px -6px rgba(0, 0, 0, 0.20), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12)',
                        '.error-message': {
                            display: 'flex',
                            i: {
                                fontSize: '3px',
                                marginRight: '5px',
                                lineHeight: 'inherit',
                            },
                        },
                        '.buttons': {
                            position: 'absolute',
                            bottom: '16px',
                            textAlign: 'center',
                            left: 0,
                            right: 0,
                        },
                    },
                },
                '.progress': {
                    position: 'absolute',
                    zIndex: 6,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    bottom: 0,
                    height: '8px',
                    transition: 'width 500ms linear',
                },
            }}
        >
            <div className="left">
                <LogoSquareDark className="logo" />
                <div className={'main-text'}>{text}</div>
                <div className="status"></div>
                <div className={'status-list'}>
                    <div>
                        <SplashStatusIcon status={props.dockerStatus} />
                        <span>
                            {props.dockerStatus === SplashStatusCheck.LOADING &&
                                'Checking Docker...'}
                            {props.dockerStatus === SplashStatusCheck.OK &&
                                'Docker found.'}
                            {props.dockerStatus === SplashStatusCheck.ERROR &&
                                'Docker not found.'}
                        </span>
                    </div>
                    <div>
                        <SplashStatusIcon status={props.localClusterStatus} />
                        <span>
                            {props.localClusterStatus ===
                                SplashStatusCheck.LOADING &&
                                'Starting local cluster...'}
                            {props.localClusterStatus ===
                                SplashStatusCheck.OK && 'Local cluster ready.'}
                            {props.localClusterStatus ===
                                SplashStatusCheck.ERROR &&
                                'Local cluster failed.'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="right">
                {hasError && (
                    <div className={'errors'}>
                        <Typography variant={'body2'}>
                            {props.localClusterStatus ===
                                SplashStatusCheck.ERROR && (
                                <div className={'error-message'}>
                                    <i className="fas fa-circle"></i>
                                    <span>Local cluster failed to start.</span>
                                </div>
                            )}
                            {props.dockerStatus === SplashStatusCheck.ERROR && (
                                <div className={'error-message'}>
                                    <i className="fas fa-circle"></i>
                                    <span>
                                        Make sure docker is installed and
                                        running
                                    </span>
                                </div>
                            )}
                        </Typography>
                        <div className={'buttons'}>
                            <Button
                                size={'small'}
                                sx={{
                                    marginRight: '5px',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.20)',
                                    },
                                }}
                                onClick={() => {
                                    setProgress(minProgress);
                                    props.onQuit();
                                }}
                                color="inherit"
                            >
                                Quit
                            </Button>
                            <Button
                                size={'small'}
                                sx={{
                                    border: '1px solid rgba(255, 255, 255, 0.20)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.20)',
                                    },
                                }}
                                onClick={() => {
                                    setProgress(minProgress);
                                    props.onRetry();
                                }}
                                color="inherit"
                                variant={'outlined'}
                            >
                                Try again
                            </Button>
                        </div>
                    </div>
                )}
                <LogoTextWhite className="logo" />
                <div className="gradients image-right" />
                <div className="gradients image-left" />
                <div className="gradients image-main" />
                <div className="image" />
            </div>
            <div className="progress" style={{ width: `${progress}%` }} />
        </Paper>
    );
};
