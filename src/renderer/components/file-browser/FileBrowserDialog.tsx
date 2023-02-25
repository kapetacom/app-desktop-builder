import React, { createRef } from 'react';
import { FileInfo } from '@blockware/ui-web-types';
import { FileSystemStore } from '@blockware/ui-web-context';
import {
    Button,
    ButtonStyle,
    ButtonType,
    Modal,
    ModalSize,
} from '@blockware/ui-web-components';

import { FileBrowser } from './FileBrowser';
import './FileBrowserDialog.less';

interface Props {
    service: FileSystemStore;
    onSelect: (file: FileInfo) => void;
    onClose: () => void;
    selectable?: (file: FileInfo) => boolean;
    open?: boolean;
    skipFiles: string[]; // files that already are imported
}

interface State {
    selection?: FileInfo;
}

export class FileBrowserDialog extends React.Component<Props,State> {

    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    private onSelect(selection?: FileInfo) {
        this.setState({
            selection,
        });
    }

    private selectFile() {
        if (!this.state.selection) {
            return;
        }

        this.props.onSelect(this.state.selection);

        this.setState({
            selection: undefined,
        });
    }

    render() {
        return (
            <Modal
                open={this.props.open}
                onClose={this.props.onClose}
                size={ModalSize.medium}
                title="Choose file"
                className="file-browser-dialog"
            >
                <div className="file-browser-dialog-body">
                    <FileBrowser
                        skipFiles={this.props.skipFiles}
                        service={this.props.service}
                        selectable={this.props.selectable}
                        selection={this.state.selection}
                        onSelect={(file) => this.onSelect(file)}
                    />

                    <div className="file-browser-actions">
                        <Button
                            type={ButtonType.BUTTON}
                            style={ButtonStyle.PRIMARY}
                            width={100}
                            text="Select"
                            disabled={!this.state.selection}
                            onClick={() => this.selectFile()}
                        />
                        <Button
                            type={ButtonType.BUTTON}
                            style={ButtonStyle.DANGER}
                            width={100}
                            text="Cancel"
                            onClick={() => this.props.onClose()}
                        />
                    </div>
                </div>
            </Modal>
        );
    }
}
