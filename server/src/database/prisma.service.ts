import { Global, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() { super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }); }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
export const accountInclude = { talent: { include: { cvFile: true } }, company: true } as const;
export type Account = Prisma.UserGetPayload<{ include: typeof accountInclude }>;
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DatabaseModule {}
