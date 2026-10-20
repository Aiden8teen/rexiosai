import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { SKILLS } from '../common/skills';
const trim = ({ value }: {
  value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
export class CommunityPageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
export class CommunityListDto extends CommunityPageDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  q?: string;
  @IsOptional()
  @IsIn(SKILLS)
  tag?: string;
  @IsOptional()
  @IsIn(['latest', 'active', 'unanswered'])
  sort: 'latest' | 'active' | 'unanswered' = 'latest';
}
export class CreateAnswerDto {
  @IsIn(['ar', 'en'])
  language!: 'ar' | 'en';
  @Transform(trim)
  @IsString()
  @Length(1, 20000)
  body!: string;
}
export class CreateQuestionDto extends CreateAnswerDto {
  @Transform(trim)
  @IsString()
  @Length(15, 160)
  title!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsIn(SKILLS, { each: true })
  tags!: string[];
  @IsOptional()
  @IsString()
  @Length(0, 20000)
  codeSnippet?: string;
}
export class AcceptedAnswerDto {
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(1, 100)
  answerId!: string | null;
}
