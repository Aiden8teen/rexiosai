import { Body, Controller, Get, Post, Req, UseGuards, Injectable, UnauthorizedException, HttpException, HttpCode } from '@nestjs/common';
import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';
import { hash, compare } from 'bcryptjs';
import { PrismaService, accountInclude } from '../database/prisma.service';
import { AuthRequest, SessionGuard } from '../common/http';
import { presentUser } from '../common/present-user';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @Length(1, 128) password!: string;
}
class RegisterDto extends LoginDto {
  @IsString() @Length(1, 100) name!: string;
  @IsIn(['TALENT', 'COMPANY']) accountType!: 'TALENT' | 'COMPANY';
  @Length(8, 128) @Matches(/\d/, { message: 'Password must include a digit.' }) declare password: string;
}
@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) {}
  async register(input: RegisterDto) {
    const name = input.name.trim();
    if (!name) throw new HttpException('Name is required.', 400);
    return this.db.user.create({ data: { email: input.email.trim().toLowerCase(), passwordHash: await hash(input.password, 12), role: input.accountType, displayName: name, displayNameEn: name, ...(input.accountType === 'COMPANY' ? { company: { create: { name, nameEn: name } } } : { talent: { create: { skills: [] } } }) }, include: accountInclude });
  }
  async login(input: LoginDto) {
    const user = await this.db.user.findUnique({ where: { email: input.email.trim().toLowerCase() }, include: accountInclude });
    if (!user || !await compare(input.password, user.passwordHash)) throw new UnauthorizedException('Email or password is incorrect.');
    return user;
  }
}
@Controller('auth')
export class AuthController {
  private attempts = new Map<string, { count: number; until: number }>();
  constructor(private readonly auth: AuthService) {}
  private limit(req: AuthRequest) {
    const now = Date.now();
    for (const [key, value] of this.attempts) if (value.until < now) this.attempts.delete(key);
    const key = req.ip || 'local', attempt = this.attempts.get(key) || { count: 0, until: now + 15 * 60000 };
    if (++attempt.count > 40 || this.attempts.size > 10000) throw new HttpException('Too many attempts. Try again later.', 429);
    this.attempts.set(key, attempt);
  }
  private async session(req: AuthRequest, id: string) {
    await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.userId = id;
    await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
  }
  @Post('register') async register(@Body() body: RegisterDto, @Req() req: AuthRequest) {
    this.limit(req); const user = await this.auth.register(body); await this.session(req, user.id); return presentUser(user);
  }
  @Post('login') @HttpCode(200) async login(@Body() body: LoginDto, @Req() req: AuthRequest) {
    this.limit(req); const user = await this.auth.login(body); await this.session(req, user.id); return presentUser(user);
  }
  @Get('me') @UseGuards(SessionGuard) me(@Req() req: AuthRequest) { return presentUser(req.user); }
  @Post('logout') @HttpCode(200) async logout(@Req() req: AuthRequest) {
    await new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    req.res?.clearCookie('rexios.sid', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.SECURE_COOKIES === 'true' });
    return { ok: true };
  }
}
