// chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { MessageService } from 'src/message/message.service';
import { ProducerService } from 'src/kafka/producer.service';
import { OldMessagesConsumer } from './job-consumers/old-messages.consumer';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
    KafkaModule,
  ],

  providers: [
    ChatGateway,
    MessageService,
    ProducerService,
    OldMessagesConsumer,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
