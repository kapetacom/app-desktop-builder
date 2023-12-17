import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Alert, AlertProps, AlertTitle, Box, BoxProps, Typography } from '@mui/material';
import React, { PropsWithChildren } from 'react';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import { Plan, validateSchema } from '@kapeta/schemas';
import { getAssetTitle } from '../plan-editor/helpers';
import { CoreTypes } from '@kapeta/ui-web-components';

interface SharedProps {
    sx?: AlertProps['sx'];
    title?: string;
    resolution?: React.ReactNode;
}

export const ErrorBox = (props: { error: React.ReactNode } & SharedProps) => {
    return (
        <Alert variant={'filled'} severity={'warning'} sx={props.sx}>
            <AlertTitle>{props.title ?? 'Something went wrong'}</AlertTitle>
            {props.error}
            {props.resolution}
        </Alert>
    );
};

export const ExceptionWrapper = (props: PropsWithChildren & SharedProps) => {
    return (
        <ErrorBoundary
            fallbackRender={(fallback) => (
                <ErrorBox
                    error={
                        <>
                            <Typography>Got the following error:</Typography>
                            <Typography fontWeight={'bold'}>{fallback.error.message}</Typography>
                        </>
                    }
                    {...props}
                />
            )}
        >
            {props.children}
        </ErrorBoundary>
    );
};

export const PlanExceptionWrapper = (props: PropsWithChildren & { plan?: AssetInfo<Plan>; sx?: AlertProps['sx'] }) => {
    if (!props.plan) {
        return <>{props.children}</>;
    }
    const planName = getAssetTitle(props.plan);

    const schemaErrors = validateSchema(CoreTypes.PLAN, props.plan.content);

    const errorTitle = `Failed to load plan "${planName}"`;
    const resolutionUi = (
        <Box sx={{ mt: 2 }}>
            <Typography>Please ensure the plan in the following path exists and is valid:</Typography>
            <Typography fontWeight={'bold'}>{props.plan.ymlPath ?? 'Unknown path'}</Typography>
        </Box>
    );

    if (schemaErrors.length > 0) {
        return (
            <ErrorBox
                sx={props.sx}
                resolution={resolutionUi}
                error={
                    <Box sx={{ mt: 2 }}>
                        <Typography>Schema validation failed:</Typography>
                        {schemaErrors.map((error, index) => (
                            <Typography key={index} fontWeight={'bold'}>
                                {error.message} in {error.instancePath}
                            </Typography>
                        ))}
                    </Box>
                }
                title={errorTitle}
            />
        );
    }

    return <ExceptionWrapper {...props} resolution={resolutionUi} />;
};
