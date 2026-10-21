import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { SKILLS } from '../common/skills';
export class ProblemDto {
  @IsOptional() @IsString() @Length(0, 160) title?: string;
  @IsOptional() @IsString() @Length(0, 160) titleEn?: string;
  @IsOptional() @IsString() @Length(0, 500) summary?: string;
  @IsOptional() @IsString() @Length(0, 500) summaryEn?: string;
  @IsOptional() @IsString() @Length(0, 20000) description?: string;
  @IsOptional() @IsString() @Length(0, 20000) descriptionEn?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) deliverables?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) deliverablesEn?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) constraints?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) constraintsEn?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) criteria?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(0, 1000, { each: true }) criteriaEn?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsIn(SKILLS, { each: true }) skills?: string[];
  @IsOptional() @IsIn(['BUG', 'ISSUE', 'CHALLENGE']) category?: 'BUG' | 'ISSUE' | 'CHALLENGE';
  @IsOptional() @IsIn(['small', 'medium', 'expert']) difficulty?: 'small' | 'medium' | 'expert';
  @IsOptional() @IsInt() @Min(0) @Max(2147483647) budgetDzd?: number;
  @IsOptional() @IsDateString() deadlineAt?: string | null;
  @IsOptional() @IsString() @Length(0, 20000) privateNotes?: string;
  @IsOptional() @IsString() @Length(0, 20000) privateNotesEn?: string;
}
const list = ({ value }: { value: unknown }) => value === undefined ? undefined : (Array.isArray(value) ? value : [value]).flatMap(v => String(v).split(','));
export class ListDto {
  @IsOptional() @IsString() @Length(0, 200) q?: string;
  @IsOptional() @Transform(list) @IsArray() @IsIn(SKILLS, { each: true }) skill?: string[];
  @IsOptional() @Transform(list) @IsArray() @IsIn(['small', 'medium', 'expert'], { each: true }) difficulty?: ('small' | 'medium' | 'expert')[];
  @IsOptional() @Transform(list) @IsArray() @IsIn(['BUG', 'ISSUE', 'CHALLENGE'], { each: true }) category?: ('BUG' | 'ISSUE' | 'CHALLENGE')[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) minReward?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) maxReward?: number;
  @IsOptional() @IsIn(['newest', 'reward', 'deadline']) sort?: 'newest' | 'reward' | 'deadline';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit: number = 20;
}
