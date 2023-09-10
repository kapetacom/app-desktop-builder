import { ResourceConnectionMappingChange, ResourceRole, SchemaKind } from '@kapeta/ui-web-types';
import { AssetInfo } from '@kapeta/ui-web-plan-editor';
import _ from 'lodash';
import { BlockDefinition, Entity, EntityList, Resource } from '@kapeta/schemas';
import { DSL_LANGUAGE_ID, DSLConverters, DSLWriter } from '@kapeta/ui-web-components';

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
    newResource: Resource,
    newEntities: Entity[],
    oldResource: Resource,
    oldBlock: BlockDefinition
) {
    const targetResourceChanged = !_.isEqual(newResource, oldResource);
    const targetEntitiesChanged = !_.isEqual(oldBlock.spec.entities?.types, newEntities);
    const targetBlockChanged = targetResourceChanged || targetEntitiesChanged;
    if (!targetBlockChanged) {
        return null;
    }
    //If we had to add entities to the target block, we need to update the block definition
    const newBlockDefinition = _.cloneDeep(oldBlock);
    if (targetEntitiesChanged) {
        newBlockDefinition.spec.entities = {
            types: newEntities,
            source: {
                type: DSL_LANGUAGE_ID,
                value: DSLWriter.write(newEntities.map(DSLConverters.fromSchemaEntity)),
            },
        };
    }

    const resourceList =
        role === ResourceRole.PROVIDES ? newBlockDefinition.spec.providers : newBlockDefinition.spec.consumers;

    if (targetResourceChanged && resourceList) {
        const targetResourceIx = resourceList.findIndex((res) => res.metadata.name === oldResource.metadata.name);

        if (targetResourceIx > -1) {
            resourceList[targetResourceIx] = newResource;
        }
    }

    return newBlockDefinition;
}

type ConfigMap = { [key: string]: any };

export function getConfigurationFromEntity(
    entities?: EntityList,
    config?: ConfigMap,
    globalConfiguration?: ConfigMap
): ConfigMap {
    if (!entities || !globalConfiguration) {
        return config || {};
    }

    const mergedConfig = config ? _.cloneDeep(config) : {};
    entities.types?.forEach((type) => {
        if (!type.properties) {
            return;
        }
        Object.entries(type.properties).forEach(([propertyName, property]) => {
            if (!property.global) {
                return;
            }

            const configPath = type.name + '.' + propertyName;
            const defaultValue = globalConfiguration ? _.get(globalConfiguration, configPath) : undefined;
            if (!_.has(mergedConfig, configPath)) {
                _.set(mergedConfig, configPath, defaultValue);
            }
        });
    });

    return mergedConfig;
}

export function createGlobalConfigurationFromEntities(entities?: EntityList, configuration?: ConfigMap) {
    if (!entities) {
        return undefined;
    }
    const defaultConfig = {};
    entities.types?.forEach((type) => {
        if (!type.properties) {
            return;
        }
        Object.entries(type.properties).forEach(([propertyName, property]) => {
            if (!property.global) {
                return;
            }

            const configPath = type.name + '.' + propertyName;
            const defaultValue = configuration ? _.get(configuration, configPath) : undefined;
            _.set(defaultConfig, configPath, defaultValue);
        });
    });

    return _.isEmpty(defaultConfig) ? undefined : defaultConfig;
}
