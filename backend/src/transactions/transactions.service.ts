import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import {
  CreateTransactionDto,
  TransactionStatus,
  TransactionType,
} from './dto/create-transaction.dto';

export interface TransactionData {
  id?: string;
  transactionId: string;
  walletId: string;
  recipientUid?: string;
  type: TransactionType;
  currency: string;
  amount: number;
  recipient?: string;
  sender?: string;
  fee?: number;
  status: TransactionStatus;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue | null | string;
}

@Injectable()
export class TransactionsService {
  private readonly handlers: Record<
    TransactionType,
    (uid: string, dto: CreateTransactionDto) => Promise<TransactionData>
  >;

  constructor(private readonly firebase: FirebaseService) {
    this.handlers = {
      [TransactionType.DEPOSIT]: this.handleDeposit.bind(this),
      [TransactionType.SEND]: this.handleSend.bind(this),
      [TransactionType.SWAP]: this.handleSwap.bind(this),
      [TransactionType.REQUEST]: this.handleRequest.bind(this),
      [TransactionType.WITHDRAW]: this.handleWithdraw.bind(this),
    };
  }

  private serialize(tx: TransactionData): TransactionData {
    const ts = tx.createdAt as admin.firestore.Timestamp | null;
    return { ...tx, createdAt: ts?.toDate?.()?.toISOString() ?? null };
  }

  async createTransaction(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const handler = this.handlers[dto.type];
    if (!handler) throw new BadRequestException(`Unsupported transaction type: ${dto.type}`);
    return handler(uid, dto);
  }

  private async handleDeposit(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const { currency, amount } = dto;
    const db = this.firebase.db;
    const walletRef = db.collection('wallets').doc(uid);
    const txRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
      const wallet = await t.get(walletRef);
      if (!wallet.exists) throw new NotFoundException('Wallet not found');

      const currencies: Record<string, number> = { ...(wallet.data()!.listOfCurrencies || {}) };
      currencies[currency] = (currencies[currency] || 0) + amount;

      t.set(txRef, {
        transactionId: `tx_${Date.now()}`,
        walletId: uid,
        type: TransactionType.DEPOSIT,
        currency,
        amount,
        status: TransactionStatus.COMPLETED,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(walletRef, {
        listOfCurrencies: currencies,
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
    });

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  private async handleWithdraw(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const { currency, amount } = dto;
    const db = this.firebase.db;
    const walletRef = db.collection('wallets').doc(uid);
    const txRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
      const wallet = await t.get(walletRef);
      if (!wallet.exists) throw new NotFoundException('Wallet not found');

      const currencies: Record<string, number> = { ...(wallet.data()!.listOfCurrencies || {}) };
      if ((currencies[currency] || 0) < amount) throw new BadRequestException('Insufficient balance');

      currencies[currency] = currencies[currency] - amount;

      t.set(txRef, {
        transactionId: `tx_${Date.now()}`,
        walletId: uid,
        type: TransactionType.WITHDRAW,
        currency,
        amount,
        status: TransactionStatus.COMPLETED,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(walletRef, {
        listOfCurrencies: currencies,
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
    });

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  private async handleSend(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const { currency, amount, recipient } = dto;
    if (!recipient) throw new BadRequestException('Recipient wallet address is required');

    const db = this.firebase.db;
    const senderRef = db.collection('wallets').doc(uid);

    const recipientSnap = await db
      .collection('wallets')
      .where('wAddress', '==', recipient)
      .limit(1)
      .get();
    if (recipientSnap.empty) throw new NotFoundException('Recipient wallet not found');

    const recipientRef = db.collection('wallets').doc(recipientSnap.docs[0].id);
    const txRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
      const [senderDoc, recipientDoc] = await Promise.all([t.get(senderRef), t.get(recipientRef)]);
      if (!senderDoc.exists) throw new NotFoundException('Sender wallet not found');
      if (!recipientDoc.exists) throw new NotFoundException('Recipient wallet not found');

      const senderCurrencies: Record<string, number> = { ...(senderDoc.data()!.listOfCurrencies || {}) };
      const recipientCurrencies: Record<string, number> = { ...(recipientDoc.data()!.listOfCurrencies || {}) };

      if ((senderCurrencies[currency] || 0) < amount) throw new BadRequestException('Insufficient balance');

      senderCurrencies[currency] = (senderCurrencies[currency] || 0) - amount;
      recipientCurrencies[currency] = (recipientCurrencies[currency] || 0) + amount;

      t.set(txRef, {
        transactionId: `tx_${Date.now()}`,
        walletId: uid,
        recipientUid: recipientRef.id,
        type: TransactionType.SEND,
        currency,
        amount,
        recipient,
        status: TransactionStatus.COMPLETED,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(senderRef, {
        listOfCurrencies: senderCurrencies,
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
      t.update(recipientRef, {
        listOfCurrencies: recipientCurrencies,
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
    });

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  private async handleSwap(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const { currency: fromCurrency, amount, recipient: toCurrency, exchangeRate, fee = 0 } = dto;

    if (!toCurrency) throw new BadRequestException('Target currency (recipient field) is required for swap');
    if (!exchangeRate) throw new BadRequestException('exchangeRate is required for swap');

    const db = this.firebase.db;
    const walletRef = db.collection('wallets').doc(uid);
    const txRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
      const wallet = await t.get(walletRef);
      if (!wallet.exists) throw new NotFoundException('Wallet not found');

      const currencies: Record<string, number> = { ...(wallet.data()!.listOfCurrencies || {}) };
      const fromBalance = currencies[fromCurrency] || 0;

      if (fromBalance < amount + fee) throw new BadRequestException('Insufficient balance for swap and fee');

      const toAmount = amount * exchangeRate;
      currencies[fromCurrency] = fromBalance - amount - fee;
      currencies[toCurrency] = (currencies[toCurrency] || 0) + toAmount;

      t.set(txRef, {
        transactionId: `tx_${Date.now()}`,
        walletId: uid,
        type: TransactionType.SWAP,
        currency: fromCurrency,
        amount,
        recipient: toCurrency,
        fee,
        status: TransactionStatus.COMPLETED,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(walletRef, {
        listOfCurrencies: currencies,
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
    });

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  private async handleRequest(uid: string, dto: CreateTransactionDto): Promise<TransactionData> {
    const { currency, amount, recipient } = dto;
    if (!recipient) throw new BadRequestException('Recipient wallet address is required for a request');

    const db = this.firebase.db;

    const recipientSnap = await db
      .collection('wallets')
      .where('wAddress', '==', recipient)
      .limit(1)
      .get();
    if (recipientSnap.empty) throw new NotFoundException('Recipient wallet not found');

    const recipientUid = recipientSnap.docs[0].id;
    const txRef = db.collection('transactions').doc();
    const walletRef = db.collection('wallets').doc(uid);
    const recipientRef = db.collection('wallets').doc(recipientUid);

    await db.runTransaction(async (t) => {
      t.set(txRef, {
        transactionId: `tx_${Date.now()}`,
        walletId: uid,
        recipientUid,
        type: TransactionType.REQUEST,
        currency,
        amount,
        recipient,
        status: TransactionStatus.PENDING,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(walletRef, {
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
      t.update(recipientRef, {
        transactionIds: admin.firestore.FieldValue.arrayUnion(txRef.id),
      });
    });

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  async respondToRequest(txId: string, approved: boolean, uid: string): Promise<TransactionData> {
    const db = this.firebase.db;
    const txRef = db.collection('transactions').doc(txId);

    const txDoc = await txRef.get();
    if (!txDoc.exists) throw new NotFoundException('Transaction not found');

    const tx = txDoc.data() as TransactionData;

    if (tx.type !== TransactionType.REQUEST) throw new BadRequestException('Transaction is not a request');
    if (tx.status !== TransactionStatus.PENDING) throw new BadRequestException('Request has already been handled');

    const callerWallet = await db.collection('wallets').doc(uid).get();
    if (!callerWallet.exists) throw new NotFoundException('Your wallet was not found');
    if (callerWallet.data()!.wAddress !== tx.recipient) {
      throw new BadRequestException('You are not the intended recipient of this request');
    }

    if (approved) {
      const responderRef = db.collection('wallets').doc(uid);
      const requesterRef = db.collection('wallets').doc(tx.walletId as string);

      await db.runTransaction(async (t) => {
        const [responderDoc, requesterDoc] = await Promise.all([
          t.get(responderRef),
          t.get(requesterRef),
        ]);

        const responderCurrencies: Record<string, number> = { ...(responderDoc.data()!.listOfCurrencies || {}) };
        const requesterCurrencies: Record<string, number> = { ...(requesterDoc.data()!.listOfCurrencies || {}) };

        if ((responderCurrencies[tx.currency] || 0) < tx.amount) {
          throw new BadRequestException('Responder has insufficient balance');
        }

        responderCurrencies[tx.currency] = (responderCurrencies[tx.currency] || 0) - tx.amount;
        requesterCurrencies[tx.currency] = (requesterCurrencies[tx.currency] || 0) + tx.amount;

        t.update(txRef, { status: TransactionStatus.COMPLETED });
        t.update(responderRef, { listOfCurrencies: responderCurrencies });
        t.update(requesterRef, { listOfCurrencies: requesterCurrencies });
      });
    } else {
      await txRef.update({ status: TransactionStatus.FAILED });
    }

    return this.serialize({ id: txRef.id, ...(await txRef.get()).data() } as TransactionData);
  }

  async getTransactionsByWallet(uid: string): Promise<TransactionData[]> {
    const db = this.firebase.db;

    const [sentSnap, receivedSnap] = await Promise.all([
      db.collection('transactions').where('walletId', '==', uid).get(),
      db.collection('transactions').where('recipientUid', '==', uid).get(),
    ]);

    const seen = new Set<string>();
    const results: TransactionData[] = [];

    for (const doc of [...sentSnap.docs, ...receivedSnap.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        results.push(this.serialize({ id: doc.id, ...doc.data() } as TransactionData));
      }
    }

    return results.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getTransactionById(txId: string): Promise<TransactionData> {
    const doc = await this.firebase.db.collection('transactions').doc(txId).get();
    if (!doc.exists) throw new NotFoundException('Transaction not found');
    return this.serialize({ id: doc.id, ...doc.data() } as TransactionData);
  }
}
