import React, {useEffect, useMemo} from 'react';
import { PanelSize, SidePanel, TabContainer, TabPage } from '@kapeta/ui-web-components';
import { InstanceEventType, InstanceService } from '@kapeta/ui-web-context';

import './BlockInspectorPanel.less';
import {BlockInstanceSpec, BlockKind} from "@kapeta/ui-web-types";
import {BlockValidator, LogPanel } from '@kapeta/ui-web-plan-editor';
import {useAsync} from "react-use";

interface BlockInspectorPanelProps {
    systemId: string
    instance?: BlockInstanceSpec|null
    block?: BlockKind|null
    open: boolean
    onClosed: () => void;
}

export const BlockInspectorPanel = (props:BlockInspectorPanelProps) =>{
    const blockRef = props.instance?.block.ref;

    const emitter = useMemo(() => {
        const listeners:((entry: any) => void)[] = [];
        return {
            listeners,
            onLog: (listener: (entry: any) => void) => {
                listeners.push(listener);
            }
        }
    }, [blockRef]);

    useEffect(() => {
        if (!blockRef) {
            return;
        }

        const onInstanceLog = (entry: any) => {
            emitter.listeners.forEach((listener) => {
                listener(entry);
            });
        }

        InstanceService.subscribe(blockRef, InstanceEventType.EVENT_INSTANCE_LOG, onInstanceLog);

        return () => {
            InstanceService.unsubscribe(blockRef, InstanceEventType.EVENT_INSTANCE_LOG, onInstanceLog);
        };
    }, [blockRef, emitter]);

    async function loadLogs() {
        if (!props.instance?.id) {
            return;
        }
        const result = await InstanceService.getInstanceLogs(props.systemId, props.instance?.id);
        return result.ok === false ? [] : result.logs;
    }

    const logs = useAsync(loadLogs, [props.instance?.id]);

    const issues = useMemo(()  => {
        if (!props.block || !props.instance) {
            return [];
        }
        const validator = new BlockValidator(props.block, props.instance);
        return validator.toIssues();
    }, [props.block, props.instance]);

    const valid = issues.length === 0;

    const title = useMemo(() => {
        return props.instance ? `Inspect ${props.instance?.name}` : 'Inspect';
    }, [props.instance]);

    return (
        <SidePanel
            title={title}
            size={PanelSize.large}
            open={props.open}
            onClose={props.onClosed}
        >
            {props.instance && (
                <div className="item-inspector-panel">
                    <TabContainer>
                        <TabPage id="logs" title="Logs">
                            <LogPanel
                                key={`${props.instance.block.ref}_logs`}
                                logs={logs.value}
                                emitter={emitter}
                            />
                        </TabPage>
                        <TabPage id="issues" title="Issues">
                            <div className="issues-container" key={`${props.instance.block.ref}_issues`}>
                                {(!valid && (
                                    <>
                                        <span>Found the following issues in block</span>
                                        <ul className="issues-list">
                                            {issues.map((issue) => {
                                                return (
                                                    <li>
                                                        <div className="issue-context">
                                                            <span className="level">{issue.level}</span>:
                                                            <span className="name">{issue.name}</span>
                                                        </div>
                                                        <div className="issue-message">{issue.issue}</div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                )) || <span>No issues found</span>}
                            </div>
                        </TabPage>
                    </TabContainer>
                </div>
            )}
        </SidePanel>
    );
}
