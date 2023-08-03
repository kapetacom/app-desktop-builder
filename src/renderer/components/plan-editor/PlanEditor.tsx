import { parseKapetaUri } from '@kapeta/nodejs-utils';
import {
    Planner,
    PlannerContext,
    PlannerMode,
    withPlannerContext,
} from '@kapeta/ui-web-plan-editor';
import React, { ForwardedRef, forwardRef, useContext, useState } from 'react';
import { IResourceTypeProvider } from '@kapeta/ui-web-types';
import { useAsync, useAsyncFn } from 'react-use';
import { PlanEditorTopMenu } from './PlanEditorTopMenu';
import { usePlanEditorActions } from './PlanEditorActions';
import { PlanEditorToolBoxPanel } from './panels/toolbox/PlanEditorToolBoxPanel';
import { BlockConfigurationPanel } from './panels/block-configuration/BlockConfigurationPanel';
import {
    ConfigureItemInfo,
    EditItemInfo,
    InspectItemInfo,
    InstanceInfo,
} from './types';
import { EditorPanels } from './panels/editor/EditorPanels';
import { InspectorPanels } from './panels/InspectorPanels';
import './PlanEditor.less';
import { getInstanceConfigs } from '../../api/LocalConfigService';
import { toClass } from '@kapeta/ui-web-utils';

interface Props {
    systemId: string;
    resourceAssets: IResourceTypeProvider[];
    instanceInfos?: InstanceInfo[];
    ref: ForwardedRef<HTMLDivElement>;
}

export const PlanEditor = withPlannerContext(
    forwardRef((props: Props, ref: ForwardedRef<HTMLDivElement>) => {
        const uri = parseKapetaUri(props.systemId);
        const planner = useContext(PlannerContext);

        const [configInfo, setConfigInfo] = useState<ConfigureItemInfo | null>(
            null
        );
        const [inspectInfo, setInspectInfo] = useState<InspectItemInfo | null>(
            null
        );
        const [editInfo, setEditInfo] = useState<EditItemInfo | null>(null);

        const actions = usePlanEditorActions(
            planner,
            props.instanceInfos ?? [],
            {
                inspect: (info) => {
                    setInspectInfo(info);
                },
                configure: (info) => {
                    setConfigInfo(info);
                },
                edit: (info) => {
                    setEditInfo(info);
                },
            }
        );

        const [configurations, reloadConfiguration] = useAsyncFn(async () => {
            return getInstanceConfigs(props.systemId);
        }, [props.systemId]);

        const readonly = planner.mode !== PlannerMode.EDIT;

        const containerClass = toClass({
            'plan-editor': true,
            readonly: readonly,
        });

        return (
            <div className={containerClass} ref={ref}>
                <PlanEditorTopMenu
                    readonly={readonly}
                    version={uri.version}
                    systemId={props.systemId}
                />

                <PlanEditorToolBoxPanel
                    open={!readonly}
                    resourceAssets={props.resourceAssets}
                />

                <BlockConfigurationPanel
                    systemId={props.systemId}
                    instance={configInfo?.item.instance}
                    open={!!configInfo}
                    onClosed={async () => {
                        setConfigInfo(null);
                        await reloadConfiguration();
                    }}
                />

                <InspectorPanels
                    systemId={props.systemId}
                    info={inspectInfo}
                    onClosed={() => {
                        setInspectInfo(null);
                    }}
                />

                <EditorPanels
                    info={editInfo}
                    open={!!editInfo}
                    onClosed={() => setEditInfo(null)}
                />

                <Planner
                    actions={actions}
                    systemId={props.systemId}
                    configurations={configurations.value}
                />
            </div>
        );
    })
);
