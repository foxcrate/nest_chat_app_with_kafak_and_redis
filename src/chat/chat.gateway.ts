// chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

interface MessagePayload {
  senderId: string;
  receiverId: string;
  message: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // keep track of connected users
  private users = new Map<string, string>(); // userId -> socketId

  async handleConnection(client: Socket) {
    try {
      // 🔹 Extract token from handshake auth
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.log(`❌ Client ${client.id} missing token`);
        client.disconnect();
        return;
      }

      // 🔹 Verify token
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secretKey',
      );

      // Attach userId to socket
      client.data.userId = decoded.sub; // assume JWT has "sub" = userId
      // this.users.set(decoded.sub, client.id);
      console.log('decoded.sub: ', decoded.sub);
      console.log('client.id: ', client.id);

      await this.cacheManager.set(`user-${decoded.sub}`, client.id);

      console.log(`✅ Client connected: ${client.id}, userId: ${decoded.sub}`);
    } catch (err) {
      console.log(`❌ Invalid token for client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [userId, socketId] of this.users.entries()) {
      if (socketId === client.id) {
        this.users.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('private_message')
  async handleMessage(
    @MessageBody() payload: MessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId; // get from token
    console.log('senderId: ', senderId);

    if (!senderId) {
      console.log('❌ Unauthorized message attempt');
      return;
    }
    console.log('Received private message:', payload);

    // const receiverSocketId = this.users.get(payload.receiverId);
    const receiverSocketId = await this.cacheManager.get(
      `user-${payload.receiverId}`,
    );
    console.log('receiverSocketId: ', receiverSocketId);

    if (receiverSocketId) {
      this.server
        .to(receiverSocketId.toString())
        .emit('private_message', payload);
    }
  }
}
