import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createWallet(@Request() req: any, @Body() dto: CreateWalletDto) {
    return this.walletService.createWallet(req.user.uid, req.user.email, dto);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMyWallet(@Request() req: any) {
    return this.walletService.getWalletByUid(req.user.uid, req.user.email);
  }

  @Get('address/:wAddress')
  @UseGuards(FirebaseAuthGuard)
  async getWalletByAddress(@Param('wAddress') wAddress: string) {
    return this.walletService.getWalletByAddress(wAddress);
  }
}
