import { Box, Button, Stack, Typography } from '@mui/material';
import React from 'react';
import { AssetThumbnail } from '../../AssetThumbnail';
import { Asset } from '@kapeta/ui-web-types';
import { Plan } from '@kapeta/schemas';

interface Props {
    onOpenSample?: (plan: Asset<Plan>) => void;
    sample: Asset<Plan>;
}

export const SamplePlanSection = (props: Props) => {
    const title =
        props.sample.data.metadata.title ?? props.sample.data.metadata.name;
    return (
        <Box className={'sample-plan-section'}>
            <Typography variant={'h6'} pb={2} pt={2}>
                Sample Plan
            </Typography>
            <Stack direction={'row'} gap={3}>
                <Box
                    sx={{
                        width: '761px',
                        minWidth: '761px',
                        height: '408px',
                        minHeight: '408px',
                        flex: 0,
                    }}
                >
                    <AssetThumbnail
                        asset={props.sample}
                        onClick={props.onOpenSample}
                        width={761}
                        height={408}
                    />
                </Box>
                <Box
                    sx={{
                        flex: 1,
                    }}
                >
                    <Typography variant={'h6'} mb={2}>
                        {title}
                    </Typography>
                    <Typography mb={3}>
                        Try this sample plan to get a quick introduction to the
                        Kapeta platform and what it can do to change the way you
                        design, build and deploy software.
                    </Typography>
                    <Button
                        variant={'outlined'}
                        size={'large'}
                        color={'inherit'}
                        onClick={() =>
                            props.onOpenSample &&
                            props.onOpenSample(props.sample)
                        }
                    >
                        Open Sample
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};