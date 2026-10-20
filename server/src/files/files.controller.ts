import { BadRequestException, Body, Controller, Get, Injectable, NotFoundException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fromBuffer } from 'yauzl';
import type { Request, Response } from 'express';
import { FilePurpose } from '@prisma/client';
import { Account, PrismaService } from '../database/prisma.service';
import { AuthRequest, requireRole, SessionGuard } from '../common/http';

class UploadDto {
  @IsIn(['CV', 'APPLICATION', 'PROBLEM_PUBLIC', 'PROBLEM_PRIVATE']) purpose!: FilePurpose;
  @IsOptional() @IsString() @Length(1, 100) problemId?: string;
  @IsOptional() @IsString() @Length(1, 100) applicationId?: string;
}
const metadata = { id: true, originalName: true, byteSize: true, mimeType: true, purpose: true } as const;
async function isDocx(buffer: Buffer): Promise<boolean> {
  return new Promise(resolve => fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
    if (error || !zip) return resolve(false);
    let total = 0, count = 0, types = false, document = false, stopped = false;
    const finish = (result: boolean) => { if (!stopped) { stopped = true; zip.close(); resolve(result); } };
    zip.on('error', () => finish(false));
    zip.on('entry', entry => {
      total += entry.uncompressedSize;
      if (++count > 2000 || total > 50 * 1024 * 1024 || entry.generalPurposeBitFlag & 1 || entry.fileName.includes('..')) return finish(false);
      if (entry.fileName === '[Content_Types].xml') types = true;
      if (entry.fileName === 'word/document.xml') document = true;
      zip.readEntry();
    });
    zip.on('end', () => finish(types && document));
    zip.readEntry();
  }));
}
@Injectable()
export class FilesService {
  readonly directory = resolve(process.env.UPLOAD_DIR || './uploads');
  constructor(private readonly db: PrismaService) {}
  private async uploadContext(user: Account, dto: UploadDto) {
    if (dto.purpose === 'CV') {
      requireRole(user, 'TALENT');
      if (dto.problemId || dto.applicationId) throw new BadRequestException('CV uploads belong to your profile.');
      return {};
    }
    if (dto.purpose === 'APPLICATION') {
      requireRole(user, 'TALENT');
      if (!dto.applicationId || dto.problemId) throw new BadRequestException('Save the application draft before uploading.');
      const a = await this.db.application.findFirst({ where: { id: dto.applicationId, applicantUserId: user.id, status: 'DRAFT', problem: { status: 'OPEN' } } });
      if (!a) throw new NotFoundException('Application draft not found.');
      return { applicationId: a.id };
    }
    requireRole(user, 'COMPANY');
    if (!dto.problemId || dto.applicationId) throw new BadRequestException('Save the problem draft before uploading.');
    const p = await this.db.problem.findFirst({ where: { id: dto.problemId, companyUserId: user.id } });
    if (!p) throw new NotFoundException();
    if (dto.purpose === 'PROBLEM_PUBLIC' && await this.db.application.count({ where: { problemId: p.id, status: { not: 'DRAFT' } } })) throw new BadRequestException('The public brief is fixed after applications are submitted.');
    return { problemId: p.id };
  }
  async upload(user: Account, dto: UploadDto, file?: Express.Multer.File) {
    if (!file || file.size === 0) throw new BadRequestException('Choose a non-empty PDF or DOCX up to 5 MiB.');
    const name = file.originalname.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 160);
    const pdf = /\.pdf$/i.test(name) && file.buffer.subarray(0, 5).toString() === '%PDF-';
    const docx = /\.docx$/i.test(name) && await isDocx(file.buffer);
    if (!pdf && !docx) throw new BadRequestException('The file contents must match a PDF or DOCX document.');
    const context = await this.uploadContext(user, dto);
    const storageKey = `${randomUUID()}.${pdf ? 'pdf' : 'docx'}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(resolve(this.directory, storageKey), file.buffer, { flag: 'wx' });
    try {
      return await this.db.storedFile.create({ data: { ...context, uploaderUserId: user.id, purpose: dto.purpose, storageKey, originalName: name, mimeType: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', byteSize: file.size }, select: metadata });
    } catch (error) { await unlink(resolve(this.directory, storageKey)); throw error; }
  }
  async download(userId: string | undefined, id: string) {
    const file = await this.db.storedFile.findUnique({ where: { id }, include: { problem: { include: { acceptedApplication: true } }, application: { include: { problem: true } }, profile: true } });
    if (!file) throw new NotFoundException();
    let allowed = file.uploaderUserId === userId;
    if (file.purpose === 'PROBLEM_PUBLIC' && file.problem?.status !== 'DRAFT') allowed = true;
    if (userId && file.purpose === 'PROBLEM_PRIVATE' && file.problem?.acceptedApplication?.applicantUserId === userId) allowed = true;
    if (userId && file.purpose === 'APPLICATION' && file.application?.status !== 'DRAFT' && file.application?.problem.companyUserId === userId) allowed = true;
    if (userId && file.purpose === 'CV' && file.profile) allowed ||= !!await this.db.application.findFirst({ where: { applicantUserId: file.uploaderUserId, status: { not: 'DRAFT' }, problem: { companyUserId: userId } }, select: { id: true } });
    if (!allowed) throw new NotFoundException();
    return file;
  }
}
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}
  @Post() @UseGuards(SessionGuard) @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3 } }))
  upload(@Req() req: AuthRequest, @Body() body: UploadDto, @UploadedFile() file?: Express.Multer.File) { return this.files.upload(req.user, body, file); }
  @Get(':id') async download(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const file = await this.files.download(req.session.userId, id);
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    return res.download(resolve(this.files.directory, file.storageKey), file.originalName);
  }
}
