import { Body, Controller, Get, NotFoundException, Patch, Req, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUrl, Length, ValidateIf } from 'class-validator';
import { PrismaService, accountInclude } from '../database/prisma.service';
import { AuthRequest, SessionGuard } from '../common/http';
import { presentUser } from '../common/present-user';
import { SKILLS } from '../common/skills';

class TalentProfileDto {
  @IsOptional() @IsString() @Length(0, 100) firstName?: string;
  @IsOptional() @IsString() @Length(0, 100) lastName?: string;
  @IsOptional() @IsString() @Length(0, 200) educationLevel?: string;
  @IsOptional() @IsString() @Length(0, 200) institutionMajor?: string;
  @IsOptional() @IsString() @Length(0, 200) experienceLevel?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsIn(SKILLS, { each: true }) skills?: string[];
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) linkedInUrl?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) githubUrl?: string;
  @IsOptional() @IsString() cvFileId?: string | null;
}
class CompanyProfileDto {
  @IsOptional() @IsString() @Length(1, 150) name?: string;
  @IsOptional() @IsString() @Length(1, 150) nameEn?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail() contactEmail?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) contactUrl?: string;
  @IsOptional() @IsBoolean() shareContact?: boolean;
}
@Controller('profiles') @UseGuards(SessionGuard)
export class ProfilesController {
  constructor(private readonly db: PrismaService) {}
  @Get('me') me(@Req() req: AuthRequest) { return presentUser(req.user); }
  @Patch('me') async update(@Req() req: AuthRequest, @Body() body: Record<string, unknown>) {
    // Validate against the account's DTO, preventing cross-role field injection.
    const { plainToInstance } = await import('class-transformer');
    const { validateOrReject } = await import('class-validator');
    const dto = req.user.role === 'COMPANY' ? plainToInstance(CompanyProfileDto, body) : plainToInstance(TalentProfileDto, body);
    const { BadRequestException } = await import('@nestjs/common');
    try { await validateOrReject(dto, { whitelist: true, forbidNonWhitelisted: true }); }
    catch { throw new BadRequestException('Profile fields are invalid for this account.'); }
    if (req.user.role === 'COMPANY') {
      const data = dto as CompanyProfileDto;
      await this.db.companyProfile.update({ where: { userId: req.user.id }, data });
      if (data.name) await this.db.user.update({ where: { id: req.user.id }, data: { displayName: data.name, displayNameEn: data.nameEn || data.name } });
    } else {
      const data = dto as TalentProfileDto;
      if (data.cvFileId) {
        const file = await this.db.storedFile.findFirst({ where: { id: data.cvFileId, uploaderUserId: req.user.id, purpose: 'CV' } });
        if (!file) throw new NotFoundException('CV not found.');
      }
      await this.db.talentProfile.update({ where: { userId: req.user.id }, data });
      if (data.firstName || data.lastName) {
        const p = await this.db.talentProfile.findUniqueOrThrow({ where: { userId: req.user.id } });
        const name = `${p.firstName} ${p.lastName}`.trim();
        if (name) await this.db.user.update({ where: { id: req.user.id }, data: { displayName: name, displayNameEn: name } });
      }
    }
    return presentUser(await this.db.user.findUniqueOrThrow({ where: { id: req.user.id }, include: accountInclude }));
  }
}
