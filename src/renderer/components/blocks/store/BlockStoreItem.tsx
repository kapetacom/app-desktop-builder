import React from 'react';
import { Asset, BlockKind } from '@blockware/ui-web-types';
import { DnDDrag } from '@blockware/ui-web-components';
import { toClass } from '@blockware/ui-web-utils';

import { BlockNode } from '@blockware/ui-web-plan-editor';

import './BlockStoreItem.less';
import { observer } from 'mobx-react';

interface BlockStoreItemProps {
    item: Asset<BlockKind>;
}

@observer
class BlockStoreItem extends React.Component<BlockStoreItemProps> {
    private placeholderElement: SVGSVGElement | null = null;

    private renderPlaceholder = (): JSX.Element => {
        return (
            <svg
                className={'block-store-item-placeholder'}
                width={150}
                height={150}
                ref={(ref) => {
                    this.placeholderElement = ref;
                }}
            >
                <BlockNode
                    height={150}
                    width={150}
                    valid={true} //Blocks in the blockstore are always valid for the sort life of drag and drop
                    instanceName={
                        this.props.item.data.metadata.title ||
                        this.props.item.data.metadata.name
                    }
                    typeName={this.props.item.data.metadata.name}
                    name={this.props.item.data.metadata.name}
                    version={this.props.item.version}
                />
            </svg>
        );
    };

    render() {
        const blockStoreItem = toClass({
            'block-store-item': true,
            service: true,
        });

        let [handle, name] = this.props.item.data.metadata.name.split('/');
        if (this.props.item.data.metadata.title) {
            name = this.props.item.data.metadata.title;
        }

        return (
            <DnDDrag
                type={'block'}
                value={this.props.item}
                copyElm={this.renderPlaceholder}
            >
                <div className={blockStoreItem}>
                    <div className={'store-item '}>
                        <p className="store-item-title">
                            <span className={'name'}>{name}</span>
                            <span className={'handle'}>{handle}</span>
                        </p>
                        <p className="store-item-version">
                            {this.props.item.version}
                        </p>
                        <div className={'store-item-icon'}>
                            <img
                                alt={this.props.item.kind}
                                width="16px"
                                src={
                                    'https://cdn4.iconfinder.com/data/icons/scripting-and-programming-languages/512/Python_logo-512.png'
                                }
                            />{' '}
                        </div>
                    </div>
                </div>
            </DnDDrag>
        );
    }
}
export default BlockStoreItem;
