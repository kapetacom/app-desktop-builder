import * as Path from "path";
import React from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {action, makeObservable, observable, runInAction, toJS} from "mobx";
import { observer } from "mobx-react";

import { toClass } from "@blockware/ui-web-utils";
import type {FileInfo} from "@blockware/ui-web-types";
import { FileSystemStore } from "@blockware/ui-web-context";

import './FileBrowser.less';


const FOLDER_INDENT = 15;


interface FileStructureElement {
    file: FileInfo
    depth: number
    open?: boolean
    loaded?: boolean
    loading?: boolean
    children?: FileStructureElement[]
}

interface FileBrowserProps {
    skipFiles:string[]
    service: FileSystemStore
    onSelect: (file?: FileInfo) => void
    selectable?: (file: FileInfo) => boolean
    selection?: FileInfo;
}

const fileSorter = (a: FileStructureElement, b: FileStructureElement) => {
    if (a.file.folder && !b.file.folder) {
        return -1;
    }

    if (b.file.folder && !a.file.folder) {
        return 1;
    }

    return a.file.path.localeCompare(b.file.path);
};

@observer
export class FileBrowser extends React.Component<FileBrowserProps> {

    @observable
    private root: FileStructureElement;

    @observable
    private newFolder?: FileInfo;

    @observable
    private currentPath: string = '/';

    @observable
    private currentPathError: string = '';

    constructor(props: FileBrowserProps) {
        super(props);
        this.root = { file: { path: this.currentPath, folder: true }, open: true, depth: 0 };
        makeObservable(this);
    }

    @action
    private async loadRootFolder() {
        if (this.root.loaded ||
            this.root.loading) {
            return;
        }

        const currentPath = this.currentPath;
        const root = this.root;
        //Use the users home dir as root
        if (!currentPath ||
             currentPath === '/') {
            const homeFolder = await this.props.service.getHomeFolder();
            runInAction(() => this.setCurrentPath(homeFolder));
        }

        this.setRootFile({
          path: currentPath,
          folder: true
        })

        await this.loadFolder(root);
    }

    @action
    private setCurrentPath(path:string) {
        this.currentPath = path;
    }

    @action
    private setRootFile(file:FileInfo) {
        this.root.file = file;
    }

    private getFlattenedFiles(): FileStructureElement[] {
        const files: FileStructureElement[] = [];

        this.flattenChildren(this.root, files);

        return files;
    }

    private flattenChildren(folder: FileStructureElement, list: FileStructureElement[]) {
        if (!folder.open ||
            !folder.file.folder ||
            !folder.loaded) {
            return list;
        }

        if (folder.children) {
            folder.children.forEach((child) => {
                list.push(child);
                this.flattenChildren(child, list)
            })
        }

        return list;
    }

    @action
    private async loadFolder(folder: FileStructureElement) {
        if (!folder.loaded) {
            folder.loading = true;
            try {
                const files = await this.props.service.listFilesInFolder(folder.file.path);
                //TODO: prevent the UI from double triggering the .. (parent directory)
                runInAction(() => {
                    if (Array.isArray(files)) {
                        folder.children = files.map((file) => {
                            return {
                                file,
                                depth: folder.depth + 1
                            };
                        }).sort(fileSorter);
                    }
                })
            } catch (e) {
                console.log(e);
            } finally {
                runInAction(() => {
                  folder.loaded = true;
                  folder.loading = false;
                })
            }
        }
    }

    @action
    private async reloadFolder() {
        this.root.loaded = false;
        return this.loadFolder(this.root);
    }

    private getIconForFile(file: FileStructureElement) {
        if (file.file.folder) {
            if (file.loading) {
                return 'fad fa-w-16 fa-spin fa-spinner';
            }

            if (file.open) {
                return 'fal fa-folder-open';
            } else {
                return 'fal fa-folder';
            }

        }

        return 'fal fa-file'
    }

    private isHidden(file: FileStructureElement) {
        const name = this.getNameForFile(file);
        //TODO: Determine hidden on windows
        return name.startsWith('.');
    }

    private getNameForFile(file: FileStructureElement) {
        return Path.basename(file.file.path);
    }


    private getBreadcrumb() {
        const currentPath = this.root.file.path;
        const parts = currentPath.split(Path.sep);
        while (parts.length > 0 && !parts[0]) {
            parts.shift(); //Remove empty parts
        }
        return parts;
    }

    private isSelected(file: FileStructureElement) {
        return !!(this.props.selection &&
            this.props.selection.path === file.file.path);
    }

    private isFileSystemRoot() {
        return !this.root.file.path || this.root.file.path === '/';
    }
    @action
    private async openParent() {
        if (this.isFileSystemRoot()) {
            return;
        }

        const parent = this.root.file.path.split(Path.sep);
        parent.pop();
        this.currentPath = parent.join(Path.sep)
        this.currentPath = this.currentPath !== "" ? this.currentPath : "/";
        await this.openFolder(this.currentPath);
    }

    @action
    private async openFolder(path: string) {
        this.root = { file: { path, folder: true }, depth: 0, loading: true };
        await this.toggleFolder(this.root);
    }

    @action
    private deselectChildren(file: FileStructureElement) {
        if (!this.props.selection) {
            return;
        }

        if (file.children) {
            file.children.forEach((child) => {
                if (this.isSelected(child)) {
                    this.deselectFile(child);
                    return;
                }

                this.deselectChildren(child);
            });
        }
    }

    private async toggleFolder(file: FileStructureElement) {
        if (!file.file.folder ) {
            //If it's not a folder - select file

            this.toggleSelection(file);
            return;
        }

        if (file.open) {
            file.open = false;
            this.deselectChildren(file);
        } else {
            file.open = true;
            if (!file.loaded) {
                await this.loadFolder(file);
            }
        }
    }

    @action
    private selectFile(file: FileStructureElement) {

        if (this.props.selectable &&
            !this.props.selectable(file.file)) {
            return;
        }

        this.props.onSelect(toJS(file.file));
    }

    private isSelectable(file: FileStructureElement) {
        return !this.props.selectable ||
            this.props.selectable(file.file);

    }

    @action
    private handleDoubleClick(file: FileStructureElement) {
        if (!file.file.folder) {
            return;
        }
        this.currentPath = file.file.path;
        this.openFolder(file.file.path);
    }

    @action
    private deselectFile(file: FileStructureElement) {

        this.props.onSelect(undefined);
    }

    @action
    private toggleSelection(file: FileStructureElement) {
        if(this.isSkippedFile(file)){// prevent selected of already imported plans
            return;
        }
        if (this.isSelected(file)) {
            this.deselectFile(file);
        } else {
            this.selectFile(file);
        }
    }

    @action
    private createFolder() {
        this.newFolder = { path: '', folder: true };
    }

    @action
    private async saveNewFolder(evt: KeyboardEvent<any>) {

        if (evt.key === 'Enter' && this.newFolder) {

            if (!this.newFolder.path) {
                return;
            }

            const newFolderName = this.newFolder.path.trim();
            if (this.root.children) {
                let rootPath = this.root.file.path;
                let newFolderPath;
                if (rootPath === '/') {
                    newFolderPath = '/' + newFolderName;
                } else {
                    newFolderPath = Path.join(this.root.file.path, this.newFolder.path);
                }

                this.root.children.push({
                    file: { path: newFolderPath, folder: true },
                    depth: this.root.depth + 1
                });

                this.root.children = this.root.children.slice().sort(fileSorter);
                this.newFolder = undefined;
            }

            await this.props.service.createFolder(this.root.file.path, newFolderName);

            return;
        }

        if (evt.key === 'Escape') {
            this.newFolder = undefined;
        }
    }

    private isSkippedFile(file:FileStructureElement){
        if(!this.props.skipFiles){
            return false;
        }
        return this.props.skipFiles.filter((ref:string)=>{
            return ref=== ("file://"+file.file.path);
        }).length >0
    }

    @action
    private cancelNewFolder() {
        this.newFolder = undefined;
    }

    @action
    private async updateNewFolder(evt: ChangeEvent<HTMLInputElement>) {

        if (!this.newFolder) {
            return;
        }
        /*eslint-disable */
        this.newFolder.path = evt.target.value.replace(/[\/\\]+/g, '');
        /*eslint-disable */
    }

    componentDidMount() {
        this.loadRootFolder();
    }

    render() {

        const files = this.getFlattenedFiles();

        return (
            <div className={'file-browser-container'}>
                <div className={'actions-container'}>
                    {
                        this.currentPathError &&
                        <span className={'error-message'}>{this.currentPathError}</span>
                    }
                    <div className={'actions'}>
                        <button type={'button'}
                            title={'New folder'}
                            onClick={() => this.createFolder()}>
                            <i className={'fa fa-folder-plus'} />
                        </button>
                    </div>
                </div>
                <div className={'path-container'}>
                    {this.renderCurrentPath()}
                </div>
                <div className={'file-list-container'}>
                    {this.root.loading &&
                        <div className={'root-loader'}>
                            <i className={this.getIconForFile(this.root)} />
                            <span>Loading folder...</span>
                        </div>
                    }
                    <ul className={'file-list'}>
                        {!this.root.loading && !this.isFileSystemRoot() &&
                            <li className={'file parent'}
                                style={{ paddingLeft: '0px' }}
                                onDoubleClick={() => this.openParent()} >
                                <span className={'icon'}>
                                    ...
                                </span>
                                <span className={'name'} > ( Parent )</span>
                            </li>
                        }

                        {!this.root.loading && this.newFolder &&
                            <li className={'file new-folder'}
                                style={{ paddingLeft: '0px' }} >
                                <span className={'icon'}>
                                    <i className={'fal fa-folder-plus'} />
                                </span>
                                <span className={'name'} >
                                    <input type={'text'}
                                        autoFocus={true}
                                        value={this.newFolder ? this.newFolder.path : ''}
                                        onBlur={() => this.cancelNewFolder()}
                                        onChange={(evt) => this.updateNewFolder(evt)}
                                        onKeyDown={(evt) => this.saveNewFolder(evt)} />
                                </span>
                            </li>
                        }

                        {

                            files.map((file, ix) => {
                                const selectable = this.isSelectable(file) && !this.isSkippedFile(file);
                                const hidden = this.isHidden(file)
                                const className = toClass({
                                    'file': true,
                                    'hidden': hidden,
                                    'selected': this.isSelected(file),
                                    'loading': !!file.loading,
                                    'folder': !!file.file.folder,
                                    'selectable': selectable,
                                    'unselectable': !selectable,
                                    'exists': this.isSkippedFile(file)
                                });

                                const indent = (FOLDER_INDENT * (file.depth - 1)) + 'px';

                                return (
                                    <li key={'file-' + ix}
                                        onClick={() => this.toggleSelection(file)}
                                        onDoubleClick={() => this.handleDoubleClick(file)}
                                        className={className} style={{ paddingLeft: indent }}>

                                        <span className={'icon'}
                                            onClick={(evt) => { evt.stopPropagation(); this.toggleFolder(file) }}>
                                            <i className={this.getIconForFile(file)} />
                                        </span>

                                        <span className={'name'} >
                                            {this.getNameForFile(file)}
                                        </span>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </div>
        );
    }

    @action
    async onPathEnter(evt: KeyboardEvent<HTMLInputElement>) {
        if (evt.key !== 'Enter') {
            return;
        }

        const previousPath = this.root.file.path !== "" ? this.root.file.path : "/";
        try {
            this.currentPath = this.currentPath.trim();
            await this.openFolder(this.currentPath);
        } catch (err) {
            this.currentPathError = 'Path not found: ' + this.currentPath;
            this.currentPath = previousPath;

            await this.openFolder(this.currentPath);
        }
    }

    @action
    async onPathChange(evt: ChangeEvent<HTMLInputElement>) {
        this.currentPath = evt.target.value;
        if (this.currentPathError) {
            this.currentPathError = '';
        }
    }

    renderCurrentPath(): React.ReactNode {

        const className = toClass({
            'current-path': true,
            error: !!this.currentPathError
        });

        return (
            <div className={className}>
                <input type={'text'}
                    value={this.currentPath}
                    onChange={(evt) => this.onPathChange(evt)}
                    onKeyPress={(evt) => this.onPathEnter(evt)}
                />
            </div>
        )
    }
}
