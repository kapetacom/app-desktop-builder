import React, {useContext, useEffect, useState} from 'react';

import {toClass} from '@kapeta/ui-web-utils';
import {InstanceEventType, InstanceService} from '@kapeta/ui-web-context';
import {
    FormContainer,
    Modal,
    ModalSize,
    showToasty,
    TabContainer,
    TabPage,
    ToastType,
    Button,
    ConfigurationEditor,
    FormButtons,
    ButtonType,
    ButtonStyle, useFormContextField, DSLConverters, DSL_LANGUAGE_ID, DSLEntity
} from '@kapeta/ui-web-components';
import './PlanEditorTopMenu.less';
import {Plan} from "@kapeta/schemas";
import {PlannerContext} from "@kapeta/ui-web-plan-editor";
import {PlanForm} from "../forms/PlanForm";


const ConfigEditor = () => {
    const configurationField = useFormContextField('spec.configuration');
    const configuration = configurationField.get();
    const result = {
        code: configuration?.source?.value || '',
        entities: configuration?.types?.map ? configuration?.types?.map(DSLConverters.fromSchemaEntity) : []
    };

    const setConfiguration = (code:string, results: DSLEntity[]) =>  {
        const types = results.map(DSLConverters.toSchemaEntity);
        const configuration = {
            types,
            source: {
                type: DSL_LANGUAGE_ID,
                value: code
            }
        };
        configurationField.set(configuration);
    }

    return (
        <ConfigurationEditor value={result} onChange={(result) => {
            result.entities && setConfiguration(result.code, result.entities);
        }} />
    )
}

interface Props {
    readonly: boolean
    version: string;
    systemId: string;
    plan: Plan
}

export const PlanEditorTopMenu = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [playing, setPlaying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const doProcess = async (handler, errorMsg) => {
        setProcessing(true);
        try {
            const result = await handler();
            if (result && result.error) {
                throw new Error(result.error);
            }
        } catch (e) {
            showToasty({
                title: errorMsg,
                message: e.message,
                type: ToastType.DANGER,
            });
        } finally {
            setProcessing(false);
        }
    };

    const containerClass = toClass({
        'top-menu': true,
        'read-only': props.readonly,
        playing,
    });

    useEffect(() => {
        const updateState = async () => {
            const status = await InstanceService.getInstanceStatusForPlan(
                props.systemId
            );
            setPlaying(status.filter((s) => s.status !== 'stopped').length > 0);
        };
        updateState().catch(() => {
            // ignore initial error
        });
        return InstanceService.subscribe(
            props.systemId,
            InstanceEventType.EVENT_INSTANCE_CHANGED,
            updateState
        );
    }, [props.systemId]);

    return (
        <div className={containerClass}>
            <div className="buttons">
                <button
                    type="button"
                    disabled={playing || processing}
                    onClick={async () => {
                        await doProcess(async () => {
                            await InstanceService.startInstances(
                                props.systemId
                            );
                            setPlaying(true);
                        }, 'Failed to start plan');
                    }}
                >
                    <i className="fa fa-play" />
                    <span>Start</span>
                </button>
                <button
                    type="button"
                    disabled={!playing || processing}
                    onClick={async () => {
                        await doProcess(async () => {
                            await InstanceService.stopInstances(props.systemId);
                            setPlaying(false);
                        }, 'Failed to stop plan');
                    }}
                >
                    <i className="fa fa-stop" />
                    <span>Stop</span>
                </button>

                <button
                    type="button"
                    onClick={ () => {
                        setShowSettings(true);
                    }}
                >
                    <i className="fa fa-gear" />
                    <span>Settings</span>
                </button>
            </div>
            <Modal title={'Settings'} size={ModalSize.large}
                   open={showSettings}
                   className={'modal-plan-settings'}
                   onClose={() => setShowSettings(false)}>
                <FormContainer initialValue={planner.plan}
                               onSubmitData={(data) => {
                    planner.updatePlanMetadata(data.metadata, data.spec.configuration);
                    setShowSettings(false);
                }}>
                    <TabContainer defaultTab={'general'}>
                        <TabPage id={'general'} title={'General'}>
                            <PlanForm />
                        </TabPage>
                        <TabPage id={'configuration'} title={'Configuration'}>
                            <div className={'configuration-editor'}>
                                <p className='info'>Define configuration data types for this plan</p>
                                <ConfigEditor />
                            </div>
                        </TabPage>
                    </TabContainer>
                    <FormButtons>
                        <Button
                            width={70}
                            type={ButtonType.BUTTON}
                            style={ButtonStyle.DANGER}
                            onClick={() => {
                                setShowSettings(false);
                            }}
                            text="Cancel"
                        />
                        <Button width={70} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save" />
                    </FormButtons>
                </FormContainer>
            </Modal>
        </div>
    );
};
