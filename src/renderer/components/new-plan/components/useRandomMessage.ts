/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { useState, useEffect, useCallback } from 'react';

export const useRandomMessage = (messages: string[], intervalDuration: number): string => {
    const [currentMessage, setCurrentMessage] = useState<string>(messages[0]);
    const [index, setIndex] = useState<number>(1); // Start from the second message

    const updateMessage = useCallback(() => {
        if (index < messages.length) {
            setCurrentMessage(messages[index]);
            setIndex((prevIndex) => prevIndex + 1);
        }
    }, [index, messages]);

    useEffect(() => {
        const intervalId = window.setInterval(updateMessage, intervalDuration);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [updateMessage, intervalDuration]);

    return currentMessage;
};
