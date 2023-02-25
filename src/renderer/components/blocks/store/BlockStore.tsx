import React, { createRef } from 'react';
import * as Path from 'path';
import { Guid } from 'guid-typescript';

import {
    Asset,
    BlockKind,
    BlockMetadata,
    BlockServiceSpec,
    FileInfo,
    SchemaKind,
} from '@blockware/ui-web-types';

import {
    AssetService,
    BlockService,
    BlockTypeProvider,
    FileSystemService,
} from '@blockware/ui-web-context';

import {
    PanelAlignment,
    PanelSize,
    showToasty,
    SidePanel,
    ToastType,
} from '@blockware/ui-web-components';

import BlockStoreItem from './BlockStoreItem';

import { FileBrowserDialog } from '../../file-browser/FileBrowserDialog';
import BlockForm from '../BlockForm';

import './BlockStore.less';
import './BlockStoreSection.less';
import {BlockStoreImport} from "./BlockStoreImport";

enum FileBrowserState {
    IMPORTING,
    CREATING
}

interface State {
    fileBrowserState: FileBrowserState;
    blocks: Asset<SchemaKind<BlockServiceSpec, BlockMetadata>>[];
    useProjectHome: boolean;
    projectHome: string;
    loading: boolean;
    searchTerm: string;
}

interface Props {
    onBlockAdded?: (asset: Asset) => void;
}

class BlockStore extends React.Component<Props, State> {
    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            fileBrowserState: FileBrowserState.CREATING,
            searchTerm: '',
            loading: true,
            blocks: [],
            useProjectHome: false,
            projectHome: ''
        };
    }

    private loadBlocks = async () => {
        if (!this.mounted) {
            return;
        }

        this.setState({ loading: true });
        const state = {
            loading: false,
            blocks: [] as State['blocks'],
        };

        try {
            state.blocks = await BlockService.list();
        } catch (e: unknown) {
            console.error((e as Error).stack);
        }

        if (!this.mounted) {
            return;
        }

        this.setState(state);
    };


    componentDidMount() {
        this.mounted = true;
        this.loadBlocks();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    private async updateProjectFolder(filePath: string) {
        await FileSystemService.setProjectFolder(filePath);
        this.setState({ projectHome: filePath });
        this.closeFileDialog();
    }

    private onFileSelection = async (file: FileInfo) => {
        this.setState({ filePath: file.path });
        try {
            if (this.state.fileBrowserState === FileBrowserState.IMPORTING) {
                await this.importAsset(file.path);
            } else if (
                this.state.fileBrowserState === FileBrowserState.CREATING
            ) {
                await this.createAsset(file.path, this.state.newEntity);
            } else if (
                this.state.fileBrowserState === FileBrowserState.PROJECT_FOLDER
            ) {
                await this.updateProjectFolder(file.path);
            }
        } catch (err: any) {
            console.error('Failed on file selection', err.stack);
        }
    };

    private closeFileDialog() {
        this.fileDialog.current?.close();
    }

    private closeCreatePanel() {
        this.createPanel.current?.close();
    }

    private renderBlocks = () => {
        return (
            <div className="items">
                {this.state.blocks
                    .filter((item) => {
                        if (
                            item.data.metadata.name
                                .toLowerCase()
                                .indexOf(this.state.searchTerm.toLowerCase()) >
                            -1
                        ) {
                            return true;
                        }
                        return false;
                    })
                    .map((item, ix) => {
                        return <BlockStoreItem key={item.ref} item={item} />;
                    })}
            </div>
        );
    };

    private saveNewEntity = async (data: BlockKind) => {
        if (this.state.useProjectHome && this.state.projectHome) {
            const path = Path.join(this.state.projectHome, data.metadata.name);
            await this.createAsset(path, data);
            return;
        }

        this.setState({ newEntity: data }, () => {
            this.fileDialog.current && this.fileDialog.current.open();
        });
    };

    private openAssetImport() {
        this.setState({
            fileBrowserState: FileBrowserState.IMPORTING,
        });
    }

    private async openAssetCreate() {
        const projectHome = await FileSystemService.getProjectFolder();
        this.setState({
            fileBrowserState: FileBrowserState.CREATING,
            projectHome,
            useProjectHome: !!projectHome,
        });
    }


    private renderBlockStore = () => {
        return (
            <div className="block-store-section">
                <div className="section">
                    <div className="block-store-import-create">
                        <button
                            type="button"
                            className="create-block-button"
                            onClick={() => this.openAssetCreate()}
                        >
                            <svg
                                width="45"
                                height="37"
                                viewBox="0 0 45 37"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2.25508 20.9904C1.25248 19.4815 1.25247 17.5185 2.25508 16.0096L11.2252 2.5096C12.0593 1.25439 13.4662 0.500007 14.9733 0.500007L30.0267 0.500006C31.5338 0.500006 32.9407 1.25439 33.7748 2.50959L42.7449 16.0096C43.7475 17.5185 43.7475 19.4815 42.7449 20.9904L33.7748 34.4904C32.9407 35.7456 31.5338 36.5 30.0267 36.5L14.9733 36.5C13.4662 36.5 12.0593 35.7456 11.2252 34.4904L2.25508 20.9904Z"
                                    fill="#FC9924"
                                    stroke="#FC9924"
                                />
                                <path
                                    d="M33 18.5L13 18.5"
                                    stroke="#4A596E"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M23 28.5L23 8.49999"
                                    stroke="#4A596E"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p>Create</p>
                        </button>
                        <button
                            type="button"
                            className="import-block-button"
                            onClick={() => this.openAssetImport()}
                        >
                            <svg
                                width="45"
                                height="37"
                                viewBox="0 0 45 37"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2.25508 20.9904C1.25248 19.4815 1.25247 17.5185 2.25508 16.0096L11.2252 2.5096C12.0593 1.25439 13.4662 0.500007 14.9733 0.500007L30.0267 0.500006C31.5338 0.500006 32.9407 1.25439 33.7748 2.50959L42.7449 16.0096C43.7475 17.5185 43.7475 19.4815 42.7449 20.9904L33.7748 34.4904C32.9407 35.7456 31.5338 36.5 30.0267 36.5L14.9733 36.5C13.4662 36.5 12.0593 35.7456 11.2252 34.4904L2.25508 20.9904Z"
                                    fill="#FC9924"
                                    stroke="#FC9924"
                                />
                                <path
                                    d="M15.792 14.1689L15.792 8.00008C15.792 7.44779 16.2397 7.00008 16.792 7.00008L30.9998 7.00008C31.5521 7.00008 31.9998 7.44779 31.9998 8.00008L31.9998 29.3767C31.9998 29.929 31.5521 30.3767 30.9998 30.3767L16.792 30.3767C16.2397 30.3767 15.792 29.929 15.792 29.3767L15.792 23.5196"
                                    stroke="#544B49"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M21.7143 23.2078L26.0779 18.8441M26.0779 18.8441L21.7143 14.4805M26.0779 18.8441L8 18.8441"
                                    stroke="#544B49"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <p>Import</p>
                        </button>
                    </div>
                    <div className="block-store-search">
                        <i className="search-icon fa fa-search " />
                        <input
                            value={this.state.searchTerm}
                            onChange={(text) => {
                                this.setState({
                                    searchTerm: text.target.value,
                                });
                            }}
                            type="text"
                        />
                    </div>
                </div>

                <div className="section">
                    {this.state.loading && (
                        <div className="section">Loading...</div>
                    )}
                    {!this.state.loading && this.renderBlocks()}
                </div>
            </div>
        );
    };

    render() {
        return (
            <div className="block-store-container">
                {this.state.blocks && this.renderBlockStore()}
                <BlockStoreImport assetService={AssetService}
                                  onDone={async () => {
                                      await this.loadBlocks();
                                  }}
                                  open={}
                                  files={this.state.blocks.map((item) => {
                                      return item.ref;
                                  })} />

            </div>
        );
    }
}
export default BlockStore;
