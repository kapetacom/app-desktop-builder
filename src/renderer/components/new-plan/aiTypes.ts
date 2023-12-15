/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

export interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
