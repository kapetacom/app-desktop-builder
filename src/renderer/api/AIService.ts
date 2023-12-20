/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { clusterPath } from './ClusterConfig';
import { simpleFetch } from '@kapeta/ui-web-context';
import { AIChatMessage } from '../components/new-plan/aiTypes';

class AIService {
    async sendPrompt(handle: string, messages: AIChatMessage[]): Promise<any> {
        return simpleFetch(clusterPath(`/ai/prompt/${handle}`), {
            method: 'POST',
            body: JSON.stringify({ messages }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }
}

export const aiService = new AIService();
