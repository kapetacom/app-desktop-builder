/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { clusterPath } from './ClusterConfig';
import { simpleFetch } from '@kapeta/ui-web-context';

class AIService {
    async sendPrompt(handle: string, prompt: string, threadId?: string): Promise<any> {
        return simpleFetch(clusterPath(`/ai/prompt/${handle}`), {
            method: 'POST',
            body: JSON.stringify({ prompt, threadId }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }
}

export const aiService = new AIService();
