import { InstanceStatus } from '@kapeta/ui-web-context';

export const getStatusDot = (status: InstanceStatus) => {
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
        [InstanceStatus.STARTING]: 'are starting',
        [InstanceStatus.READY]: 'are ready',
        [InstanceStatus.UNHEALTHY]: 'are unhealthy',
        [InstanceStatus.FAILED]: 'failed to start',
        [InstanceStatus.STOPPING]: 'are stopping',
        [InstanceStatus.BUSY]: 'are unresponsive',
    };

    return {
        title:
            status === InstanceStatus.STOPPED ? `All blocks are stopped` : `One or more blocks ${titleMapping[status]}`,
        color: statusColor,
        styles: {
            backgroundColor: statusColor,
            ...animation,
        },
    };
};

export const getStatusForGroup = (statuses: InstanceStatus[]) => {
    const statusHierarchy = [
        InstanceStatus.FAILED,
        InstanceStatus.UNHEALTHY,
        InstanceStatus.STOPPING,
        InstanceStatus.STARTING,
        InstanceStatus.READY,
        InstanceStatus.STOPPED,
    ];
    for (let i = 0; i < statusHierarchy.length; i++) {
        const status = statusHierarchy[i];

        if (statuses.includes(status)) {
            return status;
        }
    }
    return InstanceStatus.STOPPED;
};
