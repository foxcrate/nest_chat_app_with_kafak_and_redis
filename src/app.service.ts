import { Injectable } from '@nestjs/common';
import { ProducerService } from './kafka/producer.service';

@Injectable()
export class AppService {
  constructor(private readonly producerService: ProducerService) {}
  async getHello() {
    await this.producerService.produce({
      topic: 'test',
      messages: [
        {
          value: 'Hello World',
        },
      ],
    });
    console.log('aloooo');

    // wait for 2 seconds
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  }
}
