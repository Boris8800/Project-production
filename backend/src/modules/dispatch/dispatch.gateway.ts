import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { DispatchService } from './dispatch.service';

type LiveLocationBody = {
  lat: number;
  lon: number;
  heading?: number;
  speedMps?: number;
  accuracyM?: number;
};

const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean);

@WebSocketGateway({
  namespace: '/dispatch',
  cors: {
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  },
})
export class DispatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly dispatch: DispatchService) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const dispatchToken = (client.handshake.auth as { dispatchToken?: string } | undefined)?.dispatchToken;
    if (!dispatchToken) {
      client.disconnect(true);
      return;
    }

    try {
      const session = await this.dispatch.resolveSession(dispatchToken);
      client.data.dispatch = { token: dispatchToken, session };

      client.join(`dispatch:${session.bookingId}`);
      client.join(`dispatch:${session.bookingId}:${session.kind}`);

      if (session.kind === 'customer') {
        await this.dispatch.touchCustomerLastSeen(session.bookingId);
      }

      // Admin visibility (broadcast on root namespace)
      this.server.of('/').to('admins').emit('dispatch.link.connected', {
        bookingId: session.bookingId,
        kind: session.kind,
        connectedAt: new Date().toISOString(),
      });

      client.emit('dispatch.connected', {
        ok: true,
        bookingId: session.bookingId,
        kind: session.kind,
      });
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const data = client.data.dispatch as { session?: { bookingId: string; kind: 'customer' | 'driver' } } | undefined;
    if (data?.session?.kind === 'customer') {
      await this.dispatch.touchCustomerLastSeen(data.session.bookingId);
    }

    if (data?.session?.bookingId) {
      this.server.of('/').to('admins').emit('dispatch.link.disconnected', {
        bookingId: data.session.bookingId,
        kind: data.session.kind,
        disconnectedAt: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('dispatch.driver.location')
  async driverLocation(
    @MessageBody() body: LiveLocationBody,
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean }>
  {
    const data = client.data.dispatch as { session?: { bookingId: string; kind: 'customer' | 'driver' } } | undefined;
    const session = data?.session;
    if (!session || session.kind !== 'driver') return { ok: false };

    // Store a fallback driver location (used when DB location isn't available yet).
    const payload = await this.dispatch.setDriverLocationFallback(session.bookingId, {
      lat: body.lat,
      lon: body.lon,
      heading: body.heading,
      speedMps: body.speedMps,
      accuracyM: body.accuracyM,
    });

    client.nsp.to(`dispatch:${session.bookingId}`).emit('dispatch.driver.location', payload);
    this.server.of('/').to('admins').emit('dispatch.journey.driver.location', {
      bookingId: session.bookingId,
      ...payload,
    });
    return { ok: true };
  }

  @SubscribeMessage('dispatch.driver.status')
  async driverStatus(
    @MessageBody() body: { status: string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean }>
  {
    const data = client.data.dispatch as
      | { token: string; session: { bookingId: string; kind: 'customer' | 'driver' } }
      | undefined;
    const session = data?.session;
    if (!session || session.kind !== 'driver' || !body?.status) return { ok: false };

    const journeyStatus = await this.dispatch.setJourneyStatusForBooking(session.bookingId, body.status);
    client.nsp.to(`dispatch:${session.bookingId}`).emit('dispatch.driver.status', journeyStatus);
    this.server.of('/').to('admins').emit('dispatch.journey.status', {
      bookingId: session.bookingId,
      ...journeyStatus,
    });
    return { ok: true };
  }

  @SubscribeMessage('dispatch.customer.location')
  async customerLocation(
    @MessageBody() body: { lat: number; lon: number; accuracyM?: number },
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean }>
  {
    const data = client.data.dispatch as { session?: { bookingId: string; kind: 'customer' | 'driver' } } | undefined;
    const session = data?.session;
    if (!session || session.kind !== 'customer') return { ok: false };

    const payload = await this.dispatch.setCustomerLocation(session.bookingId, {
      lat: body.lat,
      lon: body.lon,
      accuracyM: body.accuracyM,
    });

    client.nsp.to(`dispatch:${session.bookingId}`).emit('dispatch.customer.location', payload);
    this.server.of('/').to('admins').emit('dispatch.journey.customer.location', {
      bookingId: session.bookingId,
      ...payload,
    });
    return { ok: true };
  }
}
