import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { AddMessageDto } from './dto/add-message.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(FirebaseAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('threads')
  async createThread(@Request() req: any, @Body() dto: CreateThreadDto) {
    return this.supportService.createThread(req.user.uid, dto);
  }

  @Get('threads')
  async getAllThreads() {
    return this.supportService.getAllThreads();
  }

  @Get('threads/:id')
  async getThreadById(@Param('id') id: string) {
    return this.supportService.getThreadById(id);
  }

  @Post('threads/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user.uid, dto);
  }
}
