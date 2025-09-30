import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all messages for a user (both sent and received)
   */
  async getUserMessages(userId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get details of a single message
   */
  async getMessageById(messageId: number) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  /**
   * Save a new message
   */
  async createMessage(
    senderId: number,
    receiverId: number,
    content: string,
    sent: boolean,
  ) {
    return this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        sent,
      },
    });
  }

  async getUndeliveredMessages(userId: number) {
    return this.prisma.message.findMany({
      where: {
        receiverId: userId,
        sent: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async markMessagesAsSent(messageIds: number[]) {
    return this.prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { sent: true },
    });
  }
}
