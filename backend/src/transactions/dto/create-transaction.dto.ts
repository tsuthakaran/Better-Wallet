import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export enum TransactionType {
  DEPOSIT = 'Deposit',
  SEND = 'Send',
  SWAP = 'Swap',
  REQUEST = 'Request',
  WITHDRAW = 'Withdraw',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  // Required for Swap — the real rate fetched by the frontend from CoinGecko
  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
