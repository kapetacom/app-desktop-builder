import { InstanceStatus } from '@kapeta/ui-web-context';

export const getStatusDotForGroup = (statuses: InstanceStatus[]) => {
    const status = getStatusForGroup(statuses);
    const statusColor = {
        [InstanceStatus.STARTING]: 'success.main',
        [InstanceStatus.READY]: 'success.main',
        [InstanceStatus.STOPPING]: 'success.main',
        [InstanceStatus.STOPPED]: '#0000003b',
        [InstanceStatus.FAILED]: 'error.main',
        [InstanceStatus.UNHEALTHY]: 'warning.main',
        [InstanceStatus.BUSY]: 'warning.main',
    }[status || InstanceStatus.STOPPED];

    const shouldPulse =
        status === InstanceStatus.STARTING || status === InstanceStatus.STOPPING || status === InstanceStatus.UNHEALTHY;

    const animation = shouldPulse
        ? {
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                  '0%': {
                      opacity: 1,
                  },
                  '50%': {
                      opacity: 0.5,
                  },
                  '100%': {
                      opacity: 1,
                  },
              },
          }
        : { animation: 'none' };

    const titleMapping = {
        [InstanceStatus.STARTING]: 'One or more blocks are starting',
        [InstanceStatus.STOPPING]: 'One or more blocks are stopping',
        [InstanceStatus.UNHEALTHY]: 'One or more blocks are unhealthy',
        [InstanceStatus.FAILED]: 'One or more blocks failed to start',
        [InstanceStatus.BUSY]: 'One or more blocks are unresponsive',
        [InstanceStatus.READY]: 'All blocks are ready',
    };

    return {
        title: titleMapping[status],
        color: statusColor,
        styles: {
            backgroundColor: statusColor,
            ...animation,
        },
    };
};

export const getStatusForGroup = (statuses: InstanceStatus[]) => {
    // First status in the array that is present in the statusHierarchy array will be the status of the group
    const statusHierarchy = [
        InstanceStatus.FAILED,
        InstanceStatus.BUSY,
        InstanceStatus.UNHEALTHY,
        InstanceStatus.STOPPING,
        InstanceStatus.STARTING,
        InstanceStatus.READY,
        // Last status in the array is the default status
        InstanceStatus.STOPPED,
    ];
    for (let i = 0; i < statusHierarchy.length; i++) {
        const status = statusHierarchy[i];

        if (statuses.includes(status)) {
            return status;
        }
    }
    return statuses[statuses.length - 1];
};
