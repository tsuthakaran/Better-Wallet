import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

export interface WalletData {
  uid: string;
  email: string;
  wAddress: string;
  walletType: string;
  recoveryPhrase: string;
  listOfCurrencies: Record<string, number>;
  transactionIds: string[];
  createdAt: admin.firestore.Timestamp | null;
}

@Injectable()
export class WalletService {
  constructor(private readonly firebase: FirebaseService) {}

  async createWallet(uid: string, email: string, dto: CreateWalletDto): Promise<WalletData> {
    const ref = this.firebase.db.collection('wallets').doc(uid);
    const existing = await ref.get();

    if (existing.exists) {
      throw new ConflictException('Wallet already exists for this user');
    }

    const wAddress = await this.generateUniqueAddress();

    const data = {
      uid,
      email,
      wAddress,
      walletType: dto.walletType,
      recoveryPhrase: dto.recoveryPhrase,
      listOfCurrencies: {},
      transactionIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await ref.set(data);

    return { ...data, createdAt: null };
  }

  async getWalletByUid(uid: string, email?: string): Promise<WalletData> {
    const ref = this.firebase.db.collection('wallets').doc(uid);
    const doc = await ref.get();
    if (doc.exists) return { uid: doc.id, ...doc.data() } as WalletData;

    if (!email) throw new NotFoundException('Wallet not found');

    const wAddress = await this.generateUniqueAddress();
    const data = {
      uid,
      email,
      wAddress,
      walletType: 'Individual',
      recoveryPhrase: '',
      listOfCurrencies: {},
      transactionIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(data);
    return { ...data, createdAt: null };
  }

  async getWalletByAddress(wAddress: string): Promise<WalletData> {
    const snap = await this.firebase.db
      .collection('wallets')
      .where('wAddress', '==', wAddress)
      .limit(1)
      .get();

    if (snap.empty) throw new NotFoundException('Wallet not found');
    const doc = snap.docs[0];
    return { uid: doc.id, ...doc.data() } as WalletData;
  }

  private async generateUniqueAddress(): Promise<string> {
    while (true) {
      const address = 'W' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const snap = await this.firebase.db
        .collection('wallets')
        .where('wAddress', '==', address)
        .limit(1)
        .get();
      if (snap.empty) return address;
    }
  }
}
