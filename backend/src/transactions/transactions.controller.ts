import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(FirebaseAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req.user.uid, dto);
  }

  @Get()
  async getMyTransactions(@Request() req: any) {
    return this.transactionsService.getTransactionsByWallet(req.user.uid);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.transactionsService.getTransactionById(id);
  }

  @Patch(':id/respond')
  async respondToRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean },
  ) {
    return this.transactionsService.respondToRequest(id, body.approved, req.user.uid);
  }
}
