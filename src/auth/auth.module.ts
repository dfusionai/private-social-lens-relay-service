import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKeyGuard } from './api-key.guard';

@Global()
@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    ApiKeysModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    ApiKeyStrategy,
    ApiKeyGuard,
  ],
  exports: [AuthService, ApiKeyGuard],
})
export class AuthModule {}
