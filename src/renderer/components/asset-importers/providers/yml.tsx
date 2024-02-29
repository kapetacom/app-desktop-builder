/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { BlockImportResult, BlockImportProvider } from '../BlockImporter';
import { SingleFileResult } from '../../../utils/showFilePicker';
import YAML from 'yaml';
import { Stack, Typography } from '@mui/material';
import { BlockDefinition } from '@kapeta/schemas';
import React from 'react';
import { useLoadedPlanContext } from '../../../utils/planContextLoader';
import { AssetThumbnail } from '@kapeta/ui-web-plan-editor';
import { AssetService } from '../../../api/AssetService';
import { KapetaURI, parseKapetaUri } from '@kapeta/nodejs-utils';
import { Asset } from '@kapeta/ui-web-types';

export const KapetaYMLBlockImporter: BlockImportProvider = {
    filename: 'kapeta.yml',
    enabled(): boolean {
        return true;
    },
    async create(handle, file): Promise<BlockImportResult> {
        const blockYml = YAML.parse(file.content) as BlockDefinition;
        if (!blockYml.kind) {
            throw new Error('Invalid block YML');
        }

        if (blockYml.kind.startsWith('core/')) {
            throw new Error('The selected file was not a block');
        }

        return {
            data: blockYml,
            async apply(): Promise<Asset> {
                const importResult = await AssetService.import(`file://${file.path}`);
                if (importResult.length === 0) {
                    throw new Error('No assets were imported');
                }
                return importResult[0];
            },
            content: () => (
                <Stack direction={'column'} justifyContent={'center'} alignItems={'center'} spacing={2}>
                    <Typography>
                        Importing from file: <b>{file.path}</b>
                    </Typography>
                    <AssetThumbnail
                        width={500}
                        height={300}
                        hideMetadata={false}
                        loadPlanContext={(plan) => {
                            return useLoadedPlanContext(plan.content);
                        }}
                        asset={{
                            content: blockYml,
                            ref: `${blockYml.metadata.name}:local`,
                            path: file.path,
                            version: 'local',
                            ymlPath: file.path,
                            exists: true,
                            editable: true,
                        }}
                    />
                </Stack>
            ),
        };
    },
};
