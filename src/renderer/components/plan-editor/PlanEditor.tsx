import { parseKapetaUri } from '@kapeta/nodejs-utils';
import {
    Planner2,
    PlannerContext,
    PlannerMode,
    withPlannerContext,
} from '@kapeta/ui-web-plan-editor';
import { PlanEditorTopMenu } from './PlanEditorTopMenu';
import React, { ForwardedRef, forwardRef, useContext, useState } from 'react';
import { withPlanEditorActions } from './PlanEditorActions';
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
import { IResourceTypeProvider } from '@kapeta/ui-web-types';
import { useAsync } from 'react-use';
import { getInstanceConfigs } from '../../api/LocalConfigService';

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

        const actions = withPlanEditorActions(
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

        const configurations = useAsync(async () => {
            return getInstanceConfigs(props.systemId);
        }, [props.systemId]);

        const readonly = planner.mode !== PlannerMode.EDIT;

        return (
            <div className={'plan-editor'} ref={ref}>
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
                    onClosed={() => setConfigInfo(null)}
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

                <Planner2
                    actions={actions}
                    systemId={props.systemId}
                    configurations={configurations.value}
                />
            </div>
        );
    })
);
