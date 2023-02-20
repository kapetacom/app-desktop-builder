import YAML from 'yaml';
import React from 'react';
import { action, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import { PLAN_KIND, SchemaKind } from '@blockware/ui-web-types';
import { BlockTypeProvider } from '@blockware/ui-web-context';

import { FilePicker } from './FilePicker';
import { FileWrapper } from './FileWrapper';

import './FilePicker.less';

const VALID_KINDS = BlockTypeProvider.kinds()
    .concat([PLAN_KIND])
    .map((val) => val.toLowerCase());

interface SchemaKindImporterProps {
    onChange?: (schemas: SchemaKind[]) => void;
}

export class SchemaKindImporter extends React.Component<SchemaKindImporterProps> {
    constructor(props: SchemaKindImporterProps) {
        super(props);
    }

    onChange = (files: FileWrapper[]) => {
        if (!this.props.onChange) {
            return;
        }

        const schemas: SchemaKind[] = files.map((file) => {
            return file.data;
        });

        this.props.onChange(schemas);
    };

    fileValidator = (file: FileWrapper) => {
        return !!file.data;
    };

    fileParser = (file: FileWrapper) => {
        return this.convertToSchemaKind(file);
    };

    private convertToSchemaKind(file: FileWrapper): SchemaKind | null {
        let data = null;
        if (file.content && file.content) {
            if (file.extension === '.json') {
                data = JSON.parse(file.content);
            }

            if (['.yml', '.yaml'].indexOf(file.extension) > -1) {
                data = YAML.parse(file.content);
            }
        }

        if (!data) {
            return null;
        }

        if (!data.kind || VALID_KINDS.indexOf(data.kind.toLowerCase()) === -1) {
            return null;
        }

        if (data && data.kind && data.metadata && data.spec) {
            return data;
        }

        return null;
    }

    render() {
        return (
            <FilePicker
                multiple={true}
                maxByteSize={100 * 1024}
                extensions={'.json,.yml,.yaml'}
                fileParser={this.fileParser}
                fileValidator={this.fileValidator}
                autoLoad={true}
                onChange={this.onChange}
                renderFile={(file) => this.renderFile(file)}
            />
        );
    }

    renderFile(file: FileWrapper) {
        return (
            <>
                <div className={'name'}>{file.data.metadata.name}</div>
                <div className={'type'}>
                    <span className={'label'}>Kind:</span>
                    <span className={'value'}>{file.data.kind}</span>
                </div>
            </>
        );
    }
}
