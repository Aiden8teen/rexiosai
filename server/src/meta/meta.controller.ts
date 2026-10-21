import { Controller, Get } from '@nestjs/common';
import { SKILLS } from '../common/skills';
@Controller('meta')
export class MetaController {
  @Get()
  meta() { return { skills: SKILLS }; }
}
