import React, { createRef } from "react";
import { observer } from "mobx-react";
import * as Path from 'path';
import { action, makeObservable } from "mobx";
import {Guid} from "guid-typescript";

import {
    BlockKind,
    SchemaKind,
    BlockServiceSpec,
    BlockMetadata,
    Asset,
    FileInfo
} from "@blockware/ui-web-types";

import {
    FileSystemService,
    AssetService,
    BlockService,
    BlockTypeProvider
} from "@blockware/ui-web-context";


import {
    SidePanel,
    PanelSize,
    PanelAlignment
} from "@blockware/ui-web-components";

import BlockStoreItem from "./BlockStoreItem";

import { FileBrowserDialog } from "../../file-browser/FileBrowserDialog";
import BlockForm from "../BlockForm";

import './BlockStore.less';
import './BlockStoreSection.less';

interface BlockStoreState {
    importing: boolean
    blocks: Asset<SchemaKind<BlockServiceSpec, BlockMetadata>>[]
    newEntity: SchemaKind
    entityKey: string
    filePath: string
    loading: boolean
    searchTerm: string
}

@observer
class BlockStore extends React.Component<{}, BlockStoreState> {

    private createPanel = createRef<SidePanel>();

    private fileDialog = createRef<FileBrowserDialog>();

    private mounted:boolean = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);


        this.state = {
            importing: false,
            searchTerm: '',
            loading: true,
            filePath: '',
            blocks: [],
            newEntity: this.createNewBlock(),
            entityKey: Guid.create().toString()
        };

    }

    private createNewBlock = () => {
        return {
            kind: BlockTypeProvider.getDefaultKind(),
            metadata: {

            },
            spec: {
                target: {
                    kind: ''
                }
            }
        }
    }

    @action
    private resetNewEntity() {
        this.setState({
            newEntity: this.createNewBlock(),
            entityKey: Guid.create().toString()
        });
    }

    @action
    private loadBlocks = async () => {
        if (!this.mounted) {
            return;
        }

        this.setState({ loading: true });
        let state:any = {
            loading: false,
            blocks: []
        };

        try {
            state.blocks =  await BlockService.list();
        } catch (e:any) {
            console.error(e.stack);
        }

        if (!this.mounted) {
            return;
        }

        this.setState(state);
    };

    @action
    private importFinished() {
        AssetService.import('file://' + this.state.filePath);
        this.closeAssetImport();
    }

    private cancelNewEntity = () => {
        this.createPanel.current && this.createPanel.current.close();
        this.resetNewEntity();
    };

    private onAssetsChanged = async () => {
        await this.loadBlocks();
    };

    componentDidMount() {
        this.mounted = true;
        this.loadBlocks();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    private onFileSelection = async (file: FileInfo) => {
        this.setState({ filePath: file.path })
        try {
            if (this.state.importing) {
                await AssetService.import('file://' + file.path);
                this.closeAssetImport();
            } else {
                await AssetService.create(Path.join(file.path, '/blockware.yml'), this.state.newEntity);
                this.resetNewEntity();
                this.closeCreatePanel();
                this.closeAssetImport();
                this.loadBlocks();
            }
        } catch (err:any) {
            console.error('Failed on file selection', err.stack);
        }
    };

    private closeAssetImport() {
        this.fileDialog.current && this.fileDialog.current.close();
    }

    private closeCreatePanel() {
        this.createPanel.current && this.createPanel.current.close();
    }

    @action
    private renderBlocks =  () => {
      
            return (
                <div className={'items'}>
                    {
                        this.state.blocks.filter((item) => {
                            if (item.data.metadata.name.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) > -1) {
                                return true;
                            }
                            return false;

                        }).map((item, ix) => {
                            return (
                                <BlockStoreItem key={ix} item={item} />
                            );
                        })
                    }
                </div>

            )
    }

    @action
    private saveNewEntity = async (data:BlockKind) => {
        this.setState({newEntity: data}, () => {
            this.fileDialog.current && this.fileDialog.current.open();
        });
    };

    private openAssetImport() {
        this.fileDialog.current && this.fileDialog.current.open();
        this.setState({
            importing: true
        });
    }

    private openAssetCreate() {
        this.createPanel.current && this.createPanel.current.open();
        this.setState({
            importing: false
        });
    }

    @action
    private onNewEntityUpdate = (metadata: any, spec: any) => {
        this.setState({
            newEntity: {
                kind: this.createNewBlock().kind,
                metadata,
                spec
            }
        });
    };

    private renderBlockStore = () => {
        return (
            <div className={'block-store-section'}>

                <div className={"section"}>

                    <div className="block-store-import-create">
                        <div className="create-block-button" onClick={() => this.openAssetCreate()}>
                            <svg width="45" height="37" viewBox="0 0 45 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.25508 20.9904C1.25248 19.4815 1.25247 17.5185 2.25508 16.0096L11.2252 2.5096C12.0593 1.25439 13.4662 0.500007 14.9733 0.500007L30.0267 0.500006C31.5338 0.500006 32.9407 1.25439 33.7748 2.50959L42.7449 16.0096C43.7475 17.5185 43.7475 19.4815 42.7449 20.9904L33.7748 34.4904C32.9407 35.7456 31.5338 36.5 30.0267 36.5L14.9733 36.5C13.4662 36.5 12.0593 35.7456 11.2252 34.4904L2.25508 20.9904Z" fill="#FC9924" stroke="#FC9924" />
                                <path d="M33 18.5L13 18.5" stroke="#4A596E" strokeLinecap="round" />
                                <path d="M23 28.5L23 8.49999" stroke="#4A596E" strokeLinecap="round" />
                            </svg>
                            <p>Create</p>
                        </div>
                        <div className="import-block-button" onClick={() => this.openAssetImport()}>
                            <svg width="45" height="37" viewBox="0 0 45 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.25508 20.9904C1.25248 19.4815 1.25247 17.5185 2.25508 16.0096L11.2252 2.5096C12.0593 1.25439 13.4662 0.500007 14.9733 0.500007L30.0267 0.500006C31.5338 0.500006 32.9407 1.25439 33.7748 2.50959L42.7449 16.0096C43.7475 17.5185 43.7475 19.4815 42.7449 20.9904L33.7748 34.4904C32.9407 35.7456 31.5338 36.5 30.0267 36.5L14.9733 36.5C13.4662 36.5 12.0593 35.7456 11.2252 34.4904L2.25508 20.9904Z" fill="#FC9924" stroke="#FC9924" />
                                <path d="M15.792 14.1689L15.792 8.00008C15.792 7.44779 16.2397 7.00008 16.792 7.00008L30.9998 7.00008C31.5521 7.00008 31.9998 7.44779 31.9998 8.00008L31.9998 29.3767C31.9998 29.929 31.5521 30.3767 30.9998 30.3767L16.792 30.3767C16.2397 30.3767 15.792 29.929 15.792 29.3767L15.792 23.5196" stroke="#544B49" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21.7143 23.2078L26.0779 18.8441M26.0779 18.8441L21.7143 14.4805M26.0779 18.8441L8 18.8441" stroke="#544B49" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>Import</p>

                        </div>
                    </div>
                    <div className={"block-store-search"}>
                        <i className={"search-icon fa fa-search "} />
                        <input value={this.state.searchTerm} onChange={(text) => {
                            this.setState({ searchTerm: text.target.value });
                        }} type="text" />
                    </div>

                </div>

                {
                    <div className={'section'}>
                        {this.state.loading && <div className='section'>Loading...</div>}
                        {!this.state.loading &&
                        this.renderBlocks()}
                        </div>
                }

            </div >
        )
    }

    render() {
   
        return (

            <div className={'block-store-container'}>
                {
                    this.state.blocks && 
                    this.renderBlockStore()
                }
                <FileBrowserDialog
                    skipFiles={this.state.blocks.map(item => {
                        return item.ref;
                    })}
                    ref={this.fileDialog}
                    service={FileSystemService}
                    onSelect={this.onFileSelection}
                    onClose={this.importFinished}
                    selectable={(file) => {
                        if (this.state.importing) {
                            if (file.path.indexOf('blockware.yml') > -1) {
                                return true;
                            }
                            return false;
                        } else {
                            if (file.folder) {
                                return true;
                            }
                            return false;
                        }
                    } }
                />
                <SidePanel
                    ref={this.createPanel}
                    size={PanelSize.medium}
                    side={PanelAlignment.right}
                    onClose={this.cancelNewEntity}
                    title={'Create new Block'} >

                    <div className={'entity-form'}>
                        <BlockForm creating={true}
                                   key={this.state.entityKey}
                                   onSubmit={this.saveNewEntity}
                                   onCancel={this.cancelNewEntity} />
                    </div>
                </SidePanel>
            </div>

        );
    }
}
export default BlockStore;