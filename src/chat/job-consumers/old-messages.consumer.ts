import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../../kafka/consumer.service';
import { MessageService } from 'src/message/message.service';
import { Server } from 'socket.io';
import { ChatGateway } from 'src/chat/chat.gateway'; // 👈 import your gateway

@Injectable()
export class OldMessagesConsumer implements OnModuleInit {
  private server: Server;

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly messageService: MessageService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      { topic: 'deliver-messages' },
      {
        eachMessage: async ({ topic, partition, message }) => {
          console.log('------------- message in consumer -------------');

          const raw = message?.value?.toString();
          console.log({
            value: raw,
            topic: topic.toString(),
            partition: partition.toString(),
          });

          if (!raw) return;

          try {
            // 👇 Expect Kafka message like: { "userId": 5, "socketId": "xyz123" }
            const payload = JSON.parse(raw);
            const { userId, socketId } = payload;

            if (userId && socketId) {
              await this.deliverPendingMessages(this.server, userId, socketId);
            }
          } catch (err) {
            console.error('❌ Failed to process Kafka message', err);
          }
        },
      },
    );
  }

  private async deliverPendingMessages(
    server: Server,
    userId: number,
    socketId: string,
  ) {
    const undelivered =
      await this.messageService.getUndeliveredMessages(userId);

    if (undelivered.length === 0) return;

    console.log(
      `📨 Delivering ${undelivered.length} stored messages to user ${userId}`,
    );

    for (const msg of undelivered) {
      this.chatGateway.server.to(socketId).emit('private_message', {
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.content,
      });
    }

    await this.messageService.markMessagesAsSent(undelivered.map((m) => m.id));
  }
}
