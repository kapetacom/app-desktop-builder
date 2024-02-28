/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { useFileImporter } from '../../utils/useAssetImporter';
import { BlockImportProvider, BlockImportResult } from './BlockImporter';
import { DockerfileBlockImporter } from './providers/docker';
import { KapetaYMLBlockImporter } from './providers/yml';
import { useMemo } from 'react';
import { showToasty, ToastType } from '@kapeta/ui-web-components';
import Path from 'path';
import { FileSystemService } from '../../api/FileSystemService';
import { useKapetaContext } from '../../hooks/contextHook';

export const useBlockImporter = () => {
    const context = useKapetaContext();
    const providers: BlockImportProvider[] = useMemo(() => [KapetaYMLBlockImporter, DockerfileBlockImporter], []);

    const fileNames = useMemo(() => providers.flatMap((provider) => provider.filename), [providers]);
    const fileImporter = useFileImporter({
        title: 'Import block into your plan',
        filters: [
            {
                name: 'All files',
                extensions: ['*'],
            },
        ],
    });

    const currentHandle = context.activeContext?.identity.handle ?? 'local';

    return async (): Promise<BlockImportResult | undefined> => {
        const result = await fileImporter.importFile();
        if (!result) {
            return undefined;
        }

        const folder = Path.dirname(result.path);
        const fileName = Path.basename(result.path);

        if (fileName !== 'kapeta.yml') {
            // If we're importing anything other than a kapeta.yml file - we should check if there is
            // already a kapeta.yml file in the same directory and if so, use that instead.
            const kapetaYmlFile = Path.join(folder, 'kapeta.yml');
            if (await FileSystemService.exists(kapetaYmlFile)) {
                const ymlContent = await FileSystemService.readFile(kapetaYmlFile);
                return await KapetaYMLBlockImporter.create(currentHandle, {
                    path: kapetaYmlFile,
                    content: ymlContent,
                });
            }
        }
        for (const provider of providers) {
            const matchesProvider = fileName === provider.filename;

            if (!matchesProvider) {
                continue;
            }

            try {
                return await provider.create(currentHandle, result);
            } catch (e: any) {
                showToasty({
                    type: ToastType.ALERT,
                    message: e.message,
                    title: 'Error',
                });
            }
        }
        console.warn('No provider found for file', result);
        showToasty({
            type: ToastType.ALERT,
            message: 'Not a valid block file. Choose one of the supported files: ' + fileNames.join(', '),
            title: 'Error',
        });
        return undefined;
    };
};
