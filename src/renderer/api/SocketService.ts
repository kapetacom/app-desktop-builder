/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { Socket, io } from 'socket.io-client';
import { socketPath } from './ClusterConfig';

class SocketServiceImpl {
    private readonly _socket: Socket;
    private readonly _rooms: Set<string> = new Set<string>();
    private readonly _roomListeners: { [key: string]: number } = {};

    constructor() {
        this._socket = io(socketPath(), {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            transports: ['websocket'],
        });

        console.log('Connecting to socket: %s', socketPath());
        this._socket.on('connect', () => {
            console.log('Connected to socket server...');
            this._rooms.forEach((roomId) => {
                this.emitJoinRoom(roomId);
            });
        });
    }

    private emitJoinRoom(roomId: string) {
        this._socket.emit('join', roomId);
    }

    joinRoom(roomId: string) {
        if (!this._roomListeners[roomId]) {
            this._roomListeners[roomId] = 0;
        }

        if (this._roomListeners[roomId] === 0) {
            this.emitJoinRoom(roomId);
            this._rooms.add(roomId);
        }

        this._roomListeners[roomId]++;
    }

    leaveRoom(roomId: string) {
        if (this._roomListeners[roomId] > 0) {
            this._roomListeners[roomId]--;
            if (this._roomListeners[roomId] > 0) {
                // Still listening to this room
                return;
            }
        }
        this._socket.emit('leave', roomId);
        this._rooms.delete(roomId);
    }

    on(eventType: string, handler: any) {
        this._socket.on(eventType, handler);
    }

    off(eventType: string, handler: any) {
        this._socket.off(eventType, handler);
    }
}

export const SocketService = new SocketServiceImpl();
