import React, { DragEvent as ReactDragEvent, FormEvent } from 'react';
import _ from 'lodash';
import {
    formatBytes,
    getFileExtension,
    toClass,
} from '@blockware/ui-web-utils';

import { FileWrapper } from './FileWrapper';
import './FilePicker.less';

interface FilePickerProps {
    extensions?: string;
    multiple: boolean;
    autoLoad?: boolean;
    maxByteSize?: number;
    fileValidator?: (file: FileWrapper) => boolean;
    fileParser?: (file: FileWrapper) => any;
    onChange?: (files: FileWrapper[]) => void;
    renderFile?: (file: FileWrapper) => JSX.Element;
    renderFiles?: (files: FileWrapper[]) => JSX.Element;
}

interface FilePickerState {
    fileOver: boolean;
    invalid: boolean;
    fileOverPage: boolean;
    currentFiles: FileWrapper[];
}

export class FilePicker extends React.Component<
    FilePickerProps,
    FilePickerState
> {
    constructor(props: FilePickerProps) {
        super(props);

        this.state = {
            fileOver: false,
            fileOverPage: false,
            invalid: false,
            currentFiles: [],
        };
    }

    onDragEnterWindow = () => {
        this.setState({
            fileOverPage: true,
        });
    };

    onDragLeaveWindow = (evt: DragEvent) => {
        if (evt.x === 0 && evt.y === 0) {
            this.setState({
                fileOverPage: false,
            });
        }
    };

    onDropWindow = (evt: DragEvent) => {
        this.setState({
            fileOverPage: false,
        });
    };

    onDragEnter = (evt: ReactDragEvent) => {
        if (!evt.dataTransfer) {
            return;
        }

        this.setState({
            fileOver: true,
        });
    };

    onDragLeave = () => {
        this.setState({
            fileOver: false,
            invalid: false,
        });
    };

    onDragOver = (evt: ReactDragEvent) => {
        evt.stopPropagation();
        evt.preventDefault();

        if (evt.dataTransfer) {
            evt.dataTransfer.dropEffect = 'copy';
        }
    };

    onDrop = async (evt: ReactDragEvent) => {
        evt.preventDefault();

        this.onDragLeave();

        if (
            evt.dataTransfer &&
            evt.dataTransfer.files &&
            evt.dataTransfer.files.length > 0
        ) {
            const anyValid = await this.addFiles(evt.dataTransfer.files);
            if (!anyValid) {
                this.flashInvalid();
            }
        }
    };

    onFileInputChange = async (evt: FormEvent<HTMLInputElement>) => {
        if (!evt.currentTarget.files) {
            return;
        }

        const anyValid = await this.addFiles(evt.currentTarget.files);
        if (!anyValid) {
            this.flashInvalid();
        }
    };

    private flashInvalid() {
        this.setState({ invalid: true }, () => {
            setTimeout(() => {
                this.setState({
                    invalid: false,
                    fileOver: false,
                });
            }, 150);
        });
    }

    private isValid(file: File) {
        const extensions = this.props.extensions
            ? this.props.extensions.toLowerCase().split(/,/g)
            : null;

        if (this.props.maxByteSize && this.props.maxByteSize < file.size) {
            return false;
        }

        const extension = getFileExtension(file.name);

        if (
            extensions &&
            extensions.length > 0 &&
            extensions.indexOf(extension) === -1
        ) {
            return false;
        }

        return true;
    }

    private async addFiles(domFiles: FileList) {
        const files = this.props.multiple
            ? _.clone(this.state.currentFiles)
            : [];
        let anyValid = false;

        for (let i = 0; i < domFiles.length; i++) {
            const file = domFiles.item(i);
            if (!file) {
                continue;
            }

            if (!this.isValid(file)) {
                continue;
            }

            const extension = getFileExtension(file.name);
            const wrapper = new FileWrapper(file, extension);

            if (this.props.autoLoad) {
                await wrapper.loadAsText(this.props.fileParser);
            }

            if (
                this.props.fileValidator &&
                !this.props.fileValidator(wrapper)
            ) {
                continue;
            }

            anyValid = true;
            files.push(wrapper);

            if (!this.props.multiple && files.length > 0) {
                break; //Stop
            }
        }

        this.setState({ currentFiles: files }, () => {
            if (this.props.onChange && this.state.currentFiles.length > 0) {
                this.props.onChange(this.state.currentFiles);
            }
        });

        return anyValid;
    }

    componentDidMount() {
        window.addEventListener('dragenter', this.onDragEnterWindow, false);
        window.addEventListener('drop', this.onDropWindow, false);
        window.addEventListener('dragleave', this.onDragLeaveWindow, false);

        // @ts-ignore
        if (window.boundFilePicker) {
            //We make sure we only do this once
            return;
        }

        // @ts-ignore
        window.boundFilePicker = true;

        window.addEventListener(
            'dragover',
            function (evt) {
                evt.preventDefault();
                if (evt.dataTransfer) {
                    evt.dataTransfer.dropEffect = 'none';
                }
            },
            false
        );

        window.addEventListener(
            'drop',
            function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            },
            false
        );
    }

    componentWillUnmount() {
        window.removeEventListener('dragenter', this.onDragEnterWindow, false);
        window.removeEventListener('drop', this.onDropWindow, false);
        window.removeEventListener('dragleave', this.onDragLeaveWindow, false);
    }

    renderFile(file: FileWrapper) {
        if (this.props.renderFile) {
            //Allows overwriting the file rendering
            return this.props.renderFile(file);
        }

        return (
            <>
                <div className={'name'}>{file.name}</div>
                <div className={'type'}>
                    <span className={'label'}>Type:</span>
                    <span className={'value'}>{file.type}</span>
                </div>
                <div className={'size'}>
                    <span className={'label'}>Size:</span>
                    <span className={'value'}>{formatBytes(file.size)}</span>
                </div>
            </>
        );
    }

    renderFiles() {
        if (this.props.renderFiles) {
            //Allows overwriting the file rendering
            return this.props.renderFiles(this.state.currentFiles);
        }

        return (
            <ul className={'files'}>
                {this.state.currentFiles.map((file, ix) => {
                    return (
                        <li className={'file'} key={ix}>
                            <div className={'info'}>
                                {this.renderFile(file)}
                            </div>
                            <div className={'actions'}>
                                <button
                                    type={'button'}
                                    className={'danger'}
                                    title={'Remove file'}
                                    onClick={(evt) => {
                                        evt.preventDefault();
                                        this.removeFile(file);
                                    }}
                                >
                                    <i className={'fa fa-times'} />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    private removeFile(file: FileWrapper): void {
        const files = _.clone(this.state.currentFiles);
        _.pull(files, file);
        this.setState({
            currentFiles: files,
        });
    }

    render() {
        const accept = this.props.extensions;

        const hasFileSelection = this.state.currentFiles.length > 0;

        const containerClass = toClass({
            'file-picker-container': true,
            'file-over': this.state.fileOver,
            'file-over-page': this.state.fileOverPage,
            invalid: this.state.invalid,
            selection: hasFileSelection,
        });

        return (
            <div className={containerClass}>
                <label className={'instructions'}>
                    <div
                        className={'mouse-catcher'}
                        onDragEnterCapture={this.onDragEnter}
                        onDragLeaveCapture={this.onDragLeave}
                        onDragOverCapture={this.onDragOver}
                        onDropCapture={this.onDrop}
                    />

                    <i className="main-icon fa fa-cloud-upload" />

                    <span className={'description'}>
                        Click or drag files here to upload them now.
                    </span>

                    <input
                        type="file"
                        onChange={this.onFileInputChange}
                        value={''} //Ensures the file input field always changes
                        multiple={this.props.multiple}
                        accept={accept}
                    />
                </label>

                {hasFileSelection && this.renderFiles()}
            </div>
        );
    }
}
