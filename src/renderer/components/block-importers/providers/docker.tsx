/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { BlockImportResult, BlockImportProvider } from '../BlockImporter';
import { SingleFileResult } from '../../../utils/showFilePicker';
import { createNewBlock } from '../../creators/BlockCreator';
import { Box, Typography } from '@mui/material';
import { BlockTargetProvider, BlockTypeProvider } from '@kapeta/ui-web-context';
import React, { useMemo } from 'react';
import {
    AssetNameInput,
    AssetVersionSelector,
    AssetVersionSelectorEntry,
    FormField,
    FormFieldType,
} from '@kapeta/ui-web-components';
import { useKapetaContext } from '../../../hooks/contextHook';
import { useNamespacesForField } from '../../../hooks/useNamespacesForField';
import { fromTypeProviderToAssetType } from '../../../utils/assetTypeConverters';
import { normalizeKapetaUri, parseKapetaUri, parseVersion } from '@kapeta/nodejs-utils';
import Path from 'path';
import { Stack } from '@mui/material';
import { ILanguageTargetProvider } from '@kapeta/ui-web-types';
import { AssetService } from '../../../api/AssetService';

const TARGET_KIND = 'kapeta/language-target-docker';

const getValidBlockTypes = () => {
    try {
        const providers = BlockTypeProvider.listAll().filter((provider) => {
            try {
                BlockTargetProvider.get(TARGET_KIND, provider.kind);
                return true;
            } catch (e) {
                return false;
            }
        });
        const out = providers.map(fromTypeProviderToAssetType);
        out.sort((a, b) => {
            const aUri = parseKapetaUri(a.ref);
            const bUri = parseKapetaUri(b.ref);
            return parseVersion(bUri.version).compareTo(parseVersion(aUri.version));
        });
        return out;
    } catch (e) {
        return [];
    }
};

export const DockerfileBlockImporter: BlockImportProvider = {
    filename: 'Dockerfile',
    async create(handle, file): Promise<BlockImportResult> {
        const blockYml = createNewBlock();
        const dockerProviderVersions = BlockTargetProvider.getVersionsFor('kapeta/language-target-docker');
        const folderPath = Path.dirname(file.path);
        const ymlPath = Path.join(folderPath, 'kapeta.yml');
        const folderName = Path.basename(folderPath);

        if (dockerProviderVersions.length < 1) {
            throw new Error('Could not find any versions of the docker language target');
        }

        const validBlockTypes = getValidBlockTypes();
        if (validBlockTypes.length < 1) {
            throw new Error('Could not find any valid block types for the docker language target');
        }

        let defaultType = validBlockTypes.find((bt) => parseKapetaUri(bt.ref).fullName === 'kapeta/block-type-service');

        if (!defaultType) {
            defaultType = validBlockTypes[0];
        }

        const targetRef = `kapeta/language-target-docker:${dockerProviderVersions[0]}`;
        const dockerProvider = BlockTargetProvider.get(targetRef, defaultType.ref);
        blockYml.kind = defaultType.ref;
        blockYml.metadata.name = handle + '/' + folderName;
        blockYml.spec.target = {
            kind: normalizeKapetaUri(dockerProvider.kind + ':' + dockerProvider.version),
        };

        return {
            async apply(data) {
                const result = await AssetService.create(ymlPath, data);
                if (result.length === 0) {
                    throw new Error('No asset could be created');
                }
                return result[0];
            },
            data: blockYml,
            content: () => <DockerImportForm file={file} dockerProvider={dockerProvider} />,
        };
    },
};

const DockerImportForm = (props: { file: SingleFileResult; dockerProvider: ILanguageTargetProvider<any> }) => {
    const context = useKapetaContext();
    const namespaces = useNamespacesForField('metadata.name');

    const assetTypes: AssetVersionSelectorEntry[] = useMemo(getValidBlockTypes, []);

    const targetTypes: AssetVersionSelectorEntry[] = useMemo(() => {
        const ref = `${props.dockerProvider.kind}:${props.dockerProvider.version}`;

        return [
            {
                ref: ref,
                kind: props.dockerProvider.definition?.kind ?? props.dockerProvider.kind,
                title: props.dockerProvider.title ?? props.dockerProvider.definition?.metadata?.title,
                icon: props.dockerProvider.icon ?? props.dockerProvider.definition?.spec?.icon,
            },
        ];
    }, [props.dockerProvider]);

    const defaultHandle = context.activeContext?.identity?.handle ?? 'local';

    return (
        <Box>
            <Stack gap={2}>
                <Typography variant={'body1'}>
                    Creating block for Dockerfile in <b>{props.file.path}</b>
                </Typography>
                <Typography variant={'body1'}>
                    We just need a few more details to import your Dockerfile as a block.
                </Typography>
            </Stack>
            <AssetVersionSelector
                name="kind"
                label="Type"
                validation={['required']}
                help="The type of block you want to create."
                assetTypes={assetTypes}
            />

            <AssetNameInput
                name="metadata.name"
                label="Name"
                validation={['required']}
                namespaces={namespaces}
                autoFocus={true}
                onFocus={(evt) => {
                    evt.target.select();
                }}
                defaultValue={defaultHandle}
                help={'The name of this block - e.g. "myhandle/my-block"'}
            />

            <FormField
                name="metadata.visibility"
                type={FormFieldType.ENUM}
                validation={['required']}
                options={{
                    public: 'Public',
                    private: 'Private',
                }}
                label="Visiblity"
                help="Determine if your Block should be visible on Block Hub, The Kapeta Market Place"
            />

            <AssetVersionSelector
                name="spec.target.kind"
                label={'Target'}
                validation={['required']}
                help={'This tells the code generation process which target programming language to use.'}
                readOnly={true}
                assetTypes={targetTypes}
            />
        </Box>
    );
};
