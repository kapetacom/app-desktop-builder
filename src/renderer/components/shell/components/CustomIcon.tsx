import React from 'react';
import { SvgIcon } from '@mui/material';
import ListViewIcon from './icons/ListViewIcon.svg';
import BlockIcon from './icons/BlockIcon.svg';
import ResourceIcon from './icons/ResourceIcon.svg';
import ExpandIcon from './icons/ExpandIcon.svg';
import DeployIcon from './icons/DeployIcon.svg';

const customIcons = {
    ListView: ListViewIcon,
    Block: BlockIcon,
    Resource: ResourceIcon,
    Expand: ExpandIcon,
    Deploy: DeployIcon,
};

interface CustomIconProps {
    icon: keyof typeof customIcons;
}

export const CustomIcon = (props: CustomIconProps) => {
    const Icon = customIcons[props.icon];
    return <SvgIcon component={Icon} viewBox="0 0 24 24" />;
};
