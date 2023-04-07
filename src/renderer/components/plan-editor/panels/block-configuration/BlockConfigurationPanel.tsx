import React, {useContext, useMemo, useState} from 'react';
import {
    Button,
    ButtonStyle,
    ButtonType,
    FormButtons,
    FormContainer,
    FormField,
    FormFieldType,
    PanelSize,
    SidePanel,
    SimpleLoader,
} from '@kapeta/ui-web-components';

import { BlockService } from '@kapeta/ui-web-context';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import {BlockInstanceSpec} from "@kapeta/ui-web-types";
import { BlockConfigurationData, PlannerContext, PlannerMode } from '@kapeta/ui-web-plan-editor';

import './BlockConfigurationPanel.less';

type Options = { [key: string]: string };

interface Props {
    instance?: BlockInstanceSpec|null;
    open: boolean;
    onClosed: () => void;
    onSave: (data: BlockConfigurationData) => void;
}

export const BlockConfigurationPanel = (props: Props) => {
    const planner = useContext(PlannerContext);
    const [loading, setLoading] = useState(true);
    const [versionOptions, setVersionOptions] = useState<Options>({});

    const panelHeader = () => {
        if (!props.instance) {
            return '';
        }

        return `Configure ${props.instance?.name}`;
    };

    const data: BlockConfigurationData = useMemo<BlockConfigurationData>(() => {
        if (!props.instance) {
            return {
                version: '',
                name: '',
            };
        }
        const uri = parseKapetaUri(props.instance.block.ref);
        return {
            version: uri.version,
            name: props.instance.name,
        };
    }, [props.instance]);

    const loader = async () => {
        if (!props.instance) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const blockUri = parseKapetaUri(props.instance?.block.ref);
            const blocks = await BlockService.list();
            const opts: Options = {};
            blocks
                .filter((block) => {
                    const uri = parseKapetaUri(block.ref);
                    return uri.fullName === blockUri.fullName;
                })
                .forEach((block) => {
                    opts[block.version] = block.version === 'local' ? 'Local Disk' : block.version;
                });

            setVersionOptions(opts);
        } finally {
            setLoading(false);
        }
    };

    const readOnly = planner.mode !== PlannerMode.EDIT;

    return (
        <SidePanel title={panelHeader()} size={PanelSize.large} open={props.open} onClose={props.onClosed}>
            <SimpleLoader
                loading={loading}
                key={props.instance?.block.ref ?? 'unknown-block'}
                loader={loader}
                text="Loading details... Please wait"
            >
                <div className="block-configuration-panel">
                    <FormContainer
                        initialValue={data}
                        onSubmitData={(formData) => props.onSave(formData as BlockConfigurationData)}
                    >
                        <FormField
                            name="name"
                            label="Instance name"
                            help="This related only to the instance of the block and not the block itself."
                            readOnly={readOnly}
                            type={FormFieldType.STRING}
                        />

                        <FormField
                            name="version"
                            label="Version"
                            options={versionOptions}
                            help="The current version used by this plan"
                            readOnly={readOnly}
                            type={FormFieldType.ENUM}
                        />

                        <FormButtons>
                            <Button
                                width={70}
                                type={ButtonType.BUTTON}
                                style={ButtonStyle.DANGER}
                                onClick={props.onClosed}
                                text="Cancel"
                            />
                            <Button width={70} disabled={readOnly} type={ButtonType.SUBMIT} style={ButtonStyle.PRIMARY} text="Save" />
                        </FormButtons>
                    </FormContainer>
                </div>
            </SimpleLoader>
        </SidePanel>
    );
};
