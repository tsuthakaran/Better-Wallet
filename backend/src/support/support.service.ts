import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { AddMessageDto } from './dto/add-message.dto';
import { CreateThreadDto } from './dto/create-thread.dto';

export interface SupportMessage {
  content: string;
  senderUid: string;
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export interface SupportThread {
  id: string;
  userId: string;
  messages: SupportMessage[];
  createdAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

@Injectable()
export class SupportService {
  constructor(private readonly firebase: FirebaseService) {}

  async createThread(uid: string, dto: CreateThreadDto): Promise<SupportThread> {
    const ref = this.firebase.db.collection('supportThreads').doc();

    const data = {
      userId: uid,
      messages: [
        {
          content: dto.content,
          senderUid: uid,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await ref.set(data);
    return { id: ref.id, ...data } as any;
  }

  async getAllThreads(): Promise<SupportThread[]> {
    const snap = await this.firebase.db.collection('supportThreads').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any);
  }

  async getThreadById(id: string): Promise<SupportThread> {
    const doc = await this.firebase.db.collection('supportThreads').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Thread not found');
    return { id: doc.id, ...doc.data() } as any;
  }

  async addMessage(threadId: string, uid: string, dto: AddMessageDto): Promise<SupportThread> {
    const ref = this.firebase.db.collection('supportThreads').doc(threadId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Thread not found');

    await ref.update({
      messages: admin.firestore.FieldValue.arrayUnion({
        content: dto.content,
        senderUid: uid,
        createdAt: new Date().toISOString(),
      }),
    });

    return { id: ref.id, ...(await ref.get()).data() } as any;
  }
}
