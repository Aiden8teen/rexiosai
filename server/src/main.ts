import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Module, Controller, Get } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { DatabaseModule, PrismaService } from './database/prisma.service';
import { ApiErrorFilter, SessionGuard } from './common/http';
import { AuthController, AuthService } from './auth/auth.controller';
import { ProfilesController } from './profiles/profiles.controller';
import { ProblemsController, CompanyProblemsController } from './problems/problems.controller';
import { ProblemsService } from './problems/problems.service';
import { ApplicationsController } from './applications/applications.controller';
import { ApplicationsService } from './applications/applications.service';
import { CommentsController } from './comments/comments.controller';
import { FilesController, FilesService } from './files/files.controller';

@Controller('health')
class HealthController {
  constructor(private readonly db: PrismaService) {}
  @Get() async health() { await this.db.$queryRaw`SELECT 1`; return { status: 'ok' }; }
}
@Module({ imports: [DatabaseModule], controllers: [HealthController, AuthController, ProfilesController, ProblemsController, CompanyProblemsController, ApplicationsController, CommentsController, FilesController], providers: [AuthService, SessionGuard, ProblemsService, ApplicationsService, FilesService] })
class AppModule {}

export async function bootstrap(port = Number(process.env.PORT || 3000)) {
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) throw new Error('DATABASE_URL and SESSION_SECRET are required.');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  const allowedOrigins = (process.env.APP_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(v => v.trim());
  app.use((req: any, res: any, next: () => void) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !allowedOrigins.includes(req.headers.origin)) return res.status(403).json({ code: 'ORIGIN_REJECTED', message: 'Request origin is not allowed.' });
    next();
  });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const Store = connectPgSimple(session);
  app.use(session({ store: new Store({ pool, tableName: 'session' }), name: 'rexios.sid', secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.SECURE_COOKIES === 'true', maxAge: 7 * 86400000 } }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('RexiosAI MVP API').setVersion('1').addCookieAuth('rexios.sid').build()));
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  console.log(`Rexios API ready on port ${(app.getHttpServer().address() as any).port}`);
  return { app, pool };
}
if (require.main === module) bootstrap().catch(error => { console.error(error); process.exitCode = 1; });
