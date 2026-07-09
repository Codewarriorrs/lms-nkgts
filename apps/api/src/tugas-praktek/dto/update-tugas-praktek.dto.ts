import { PartialType } from '@nestjs/mapped-types';
import { CreateTugasPraktekDto } from './create-tugas-praktek.dto';

export class UpdateTugasPraktekDto extends PartialType(CreateTugasPraktekDto) {}
