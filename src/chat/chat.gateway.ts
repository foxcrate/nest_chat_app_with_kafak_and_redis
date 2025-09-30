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
import { MessagePayload } from './dtos/message-payload.interface';
import { MessageService } from 'src/message/message.service';
import { ProducerService } from 'src/kafka/producer.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly messageService: MessageService,
    private readonly producerService: ProducerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.log(`❌ Client ${client.id} missing token`);
        client.disconnect();
        return;
      }

      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secretKey',
      );

      client.data.userId = decoded.sub;

      await this.cacheManager.set(`user-${decoded.sub}`, client.id);

      console.log(`✅ Client connected: ${client.id}, userId: ${decoded.sub}`);

      // Deliver pending messages
      await this.producerService.produce({
        topic: 'deliver-messages',
        messages: [
          {
            value: JSON.stringify({
              userId: decoded.sub,
              socketId: client.id,
            }),
          },
        ],
      });
    } catch (err) {
      console.log(`❌ Invalid token for client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const userId = client.data.userId;
    if (userId) {
      this.cacheManager.del(`user-${userId}`);
      console.log(`🗑️ Removed user ${userId} from cache`);
    }
  }

  @SubscribeMessage('private_message')
  async handleMessage(
    @MessageBody() payload: MessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;
    console.log('senderId: ', senderId);

    if (!senderId) {
      console.log('❌ Unauthorized message attempt');
      return;
    }
    console.log('Received private message:', payload);

    const receiverSocketId = await this.cacheManager.get(
      `user-${payload.receiverId}`,
    );
    console.log('receiverSocketId: ', receiverSocketId);

    if (receiverSocketId) {
      this.server
        .to(receiverSocketId.toString())
        .emit('private_message', payload);
      //save message to db
      await this.messageService.createMessage(
        senderId,
        Number(payload.receiverId),
        payload.message,
        true,
      );
    } else {
      // user is offline, save for later
      await this.messageService.createMessage(
        senderId,
        Number(payload.receiverId),
        payload.message,
        false,
      );
    }
  }
}
