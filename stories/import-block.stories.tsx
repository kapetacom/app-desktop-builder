/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { ThemeProvider } from '@mui/material';

import { kapetaLight } from '../src/renderer/Theme';

import { BlockImporter } from '../src/renderer/components/block-importers/BlockImporter';
import { useAsync } from 'react-use';
import { KapetaYMLBlockImporter } from '../src/renderer/components/block-importers/providers/yml';
import YAML from 'yaml';
import { BlockTypeProvider } from '@kapeta/ui-web-context';
import { IconType } from '@kapeta/schemas';
import { DefaultContext } from '@kapeta/ui-web-components';
import { DockerfileBlockImporter } from '../src/renderer/components/block-importers/providers/docker';

export default {
    title: 'Import Block',
};

const BlockTestData = {
    kind: 'kapeta/block-type-service:1.0.0',
    metadata: {
        title: 'Test Block',
        name: 'kapeta/test-block',
        description: 'This is a test block',
    },
    spec: {},
};

// @ts-ignore
BlockTypeProvider.register({
    kind: 'kapeta/block-type-service',
    version: '1.0.0',
    icon: {
        value: 'fa fa-cogs',
        type: IconType.Fontawesome5,
    },
    title: 'Service',
    // @ts-ignore
    definition: {
        kind: 'core/block-type',
        metadata: {
            title: 'Service',
            name: 'kapeta/block-type-service',
            description: 'A service block',
        },
    },
});

export const ImportBlockFromKapetaYML = () => {
    const fileImport = useAsync(async () => {
        return KapetaYMLBlockImporter.create('kapeta', {
            content: YAML.stringify(BlockTestData),
            path: '/somewhere/local/kapeta.yml',
        });
    }, []);
    return (
        <DefaultContext>
            <ThemeProvider theme={kapetaLight}>
                {fileImport.value && (
                    <BlockImporter
                        open={true}
                        onImported={(asset) => {
                            console.log('Imported', asset);
                        }}
                        onClose={() => {}}
                        file={fileImport.value}
                    />
                )}
                {fileImport.loading && 'Loading...'}
                {fileImport.error && 'Error: ' + fileImport.error.message}
            </ThemeProvider>
        </DefaultContext>
    );
};

export const ImportBlockFromDockerfile = () => {
    const fileImport = useAsync(async () => {
        return DockerfileBlockImporter.create('kapeta', {
            content: 'FROM ubuntu:latest\nRUN apt-get update\nRUN apt-get install -y curl',
            path: '/somewhere/local/Dockerfile',
        });
    }, []);
    return (
        <DefaultContext>
            <ThemeProvider theme={kapetaLight}>
                {fileImport.value && (
                    <BlockImporter
                        open={true}
                        onImported={(asset) => {
                            console.log('Imported', asset);
                        }}
                        onClose={() => {}}
                        file={fileImport.value}
                    />
                )}
                {fileImport.loading && 'Loading...'}
                {fileImport.error && 'Error: ' + fileImport.error.message}
            </ThemeProvider>
        </DefaultContext>
    );
};
