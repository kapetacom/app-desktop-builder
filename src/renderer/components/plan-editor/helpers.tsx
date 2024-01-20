/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ResourceRole, type ResourceWithSpec, SchemaKind } from '@kapeta/ui-web-types';
import { AssetInfo, createEntityList, getBlockEntities, isDirectDSL } from '@kapeta/ui-web-plan-editor';
import _ from 'lodash';
import { BlockDefinition, Entity } from '@kapeta/schemas';
import { DSLConverters } from '@kapeta/ui-web-components';
import Path from 'path';
import { DSLData } from '@kapeta/kaplang-core';

export function getBlockFolderForPlan(planPath: string): string {
    return Path.join(planPath, 'blocks');
}

export function ProviderHeaderIcon() {
    return (
        <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8.33325" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.87" />
            <rect width="6.66667" height="6.66667" fill="#F9DFDD" />
            <rect x="8.33325" y="8.33333" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.75" />
            <rect x="16.6667" y="8.33333" width="6.66667" height="6.66667" fill="#F9DFDD" fillOpacity="0.6" />
        </svg>
    );
}

export function ConsumerHeaderIcon() {
    return (
        <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 15)"
                fill="#F9DFDD"
                fillOpacity="0.87"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 0.000244141 15)"
                fill="#F9DFDD"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 8.3335 6.66667)"
                fill="#F9DFDD"
                fillOpacity="0.75"
            />
            <rect
                width="6.66667"
                height="6.66667"
                transform="matrix(1 8.74228e-08 8.74228e-08 -1 16.667 6.66667)"
                fill="#F9DFDD"
                fillOpacity="0.6"
            />
        </svg>
    );
}

export function getAssetTitle(asset: AssetInfo<SchemaKind>): string {
    return getSchemaTitle(asset.content);
}

export function getSchemaTitle(asset: SchemaKind): string {
    return asset.metadata.title ?? asset.metadata.name;
}

export function updateBlockFromMapping(
    role: ResourceRole,
    newResource: ResourceWithSpec<any>,
    newEntities: Entity[] | DSLData[],
    oldResource: ResourceWithSpec<any>,
    oldBlock: BlockDefinition
) {
    getBlockEntities(newResource.kind, oldBlock, false);

    const directDSL = isDirectDSL(newResource.kind);
    const oldEntities = directDSL
        ? getBlockEntities(newResource.kind, oldBlock, false)
        : oldBlock.spec.entities?.types ?? [];

    const targetResourceChanged = !_.isEqual(newResource, oldResource);
    const targetEntitiesChanged = !_.isEqual(newEntities, oldEntities);
    const targetBlockChanged = targetResourceChanged || targetEntitiesChanged;
    if (!targetBlockChanged) {
        return null;
    }
    //If we had to add entities to the target block, we need to update the block definition
    const newBlockDefinition = _.cloneDeep(oldBlock);
    if (targetEntitiesChanged) {
        if (directDSL) {
            const dslTypes = newEntities as DSLData[];
            newBlockDefinition.spec.entities = createEntityList(dslTypes);
        } else {
            const entities = newEntities as Entity[];
            const dslEntities = entities
                .map((entity) => {
                    return DSLConverters.fromSchemaEntity(entity);
                })
                .filter((entity) => entity !== undefined) as DSLData[];
            newBlockDefinition.spec.entities = createEntityList(dslEntities);
        }
    }

    const resourceList: ResourceWithSpec<any>[] | undefined =
        role === ResourceRole.PROVIDES ? newBlockDefinition.spec.providers : newBlockDefinition.spec.consumers;

    if (targetResourceChanged && resourceList) {
        const targetResourceIx = resourceList.findIndex((res) => res.metadata.name === oldResource.metadata.name);

        if (targetResourceIx > -1) {
            resourceList[targetResourceIx] = newResource;
        }
    }

    return newBlockDefinition;
}
