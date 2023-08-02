import {useEffect} from "react";
import {SocketService} from "@kapeta/ui-web-context";
import {ListActions} from "react-use/lib/useList";
import {KapetaNotification} from "../../components/shell/types";

const EVENT_DOCKER_PULL_IMAGE = 'docker-image-pull';

interface EventDockerPullEvent {
    payload: {
        image: string;
        percent: number;
        timeTaken?: number;
        status?:any;
    }
}

export const useDockerPullEvents = (notificationsHandler:ListActions<KapetaNotification>) => {
    useEffect(() => {
        const dockerPullEventIds: { id:string, image:string }[] = []

        const dockerPullEventHandler = (event: EventDockerPullEvent) => {
            let [image, tag] = event.payload.image.split(':');

            const imageParts = image.split('/');
            if (imageParts.length > 2) {
                //Strip the registry
                image = imageParts.slice(1).join('/');
            }
            image = `${image}:${tag}`;
            const id = `pull:${event.payload.image}`;

            const idFinder = entry => entry.id === id;

            if (!dockerPullEventIds.some(idFinder)) {
                dockerPullEventIds.push({id,image});
            } else if (event.payload.percent === 100) {
                dockerPullEventIds.splice(dockerPullEventIds.findIndex(idFinder), 1);
            }

            notificationsHandler.upsert((a,b) => {
                return a.id === b.id;
            }, {
                id: id,
                type: 'progress',
                message: `Pulling image: ${image}`,
                read: false,
                progress: event.payload.percent,
                timestamp: Date.now(),
            });
        }

        const disconnectHandler = () => {
            while(dockerPullEventIds.length > 0) {
                const entry = dockerPullEventIds.pop()!;

                notificationsHandler.upsert((a,b) => {
                    return a.id === b.id;
                }, {
                    id: entry.id,
                    type: 'error',
                    message: `Failed to pull: ${entry.image}`,
                    read: false,
                    timestamp: Date.now(),
                });
            }
        }

        SocketService.on(
            EVENT_DOCKER_PULL_IMAGE,
            dockerPullEventHandler
        );

        SocketService.on(
            'disconnect',
            disconnectHandler
        );



        return () => {
            SocketService.off(EVENT_DOCKER_PULL_IMAGE, dockerPullEventHandler);
            SocketService.off('disconnect',disconnectHandler);
        }
    }, [notificationsHandler]);
}
