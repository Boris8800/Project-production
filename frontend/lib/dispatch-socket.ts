import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from './constants';

export function createDispatchSocket(dispatchToken: string): Socket {
  return io(`${API_BASE_URL}/dispatch`, {
    transports: ['websocket'],
    auth: { dispatchToken },
  });
}
