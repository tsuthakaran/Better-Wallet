import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './auth.guard';

@Module({
  providers: [FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}
