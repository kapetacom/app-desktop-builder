import React, {PropsWithChildren} from "react";
import {Box, Stack, Typography} from "@mui/material";
import {Asset, SchemaKind} from "@kapeta/ui-web-types";
import {AssetKindIcon} from "@kapeta/ui-web-components";
import {Plan} from "@kapeta/schemas";

interface Props {
    asset: Asset<SchemaKind>;
    width: number;
    height: number;
    onClick?: (plan:Asset<Plan>) => void;
}

export const AssetThumbnail = (props: Props & PropsWithChildren) => {

    const title = props.asset.data.metadata.title ?? props.asset.data.metadata.name;

    return <Stack className={'plan-thumbnail'}
                    onClick={() => props.onClick?.(props.asset)}
                  direction={'column'}
                  gap={1}
                  sx={{
                      transition: (theme) => theme.transitions.create('all', {
                          duration: theme.transitions.duration.short,
                      }),
                      cursor: props.onClick ? 'pointer' : undefined,
                      width: `${props.width}px`,
                      height: `${props.height}px`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1ox solid rgba(69, 90, 100, 0.50)',
                      bgcolor: '#F4EEEE',
                      '&:hover': {
                          boxShadow: 3
                      }
                  }}
    >
        <Box className={'preview'} flex={1}>
            {props.children}
        </Box>
        <Stack className={'metadata'} direction={'row'}
               p={2}
               gap={1}
               sx={{
                   bgcolor: '#263238',
                   color: 'white'
               }}>
            <AssetKindIcon asset={props.asset.data} size={24}/>
            <Box flex={1}>
                <Typography mb={'4px'} fontSize={18} fontWeight={500} variant={'h6'}>
                    {title}
                </Typography>
                <Typography color={'#eeeeee'} fontSize={12} fontWeight={400} variant={'caption'}>
                    {props.asset.version}
                </Typography>
            </Box>
        </Stack>
    </Stack>
}
