import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  walletType: string;

  @IsString()
  @IsNotEmpty()
  recoveryPhrase: string;
}
