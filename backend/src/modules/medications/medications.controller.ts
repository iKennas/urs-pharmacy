import { Body, Controller, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, UpdateMedicationDto } from './dto/medication.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  search(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string) {
    return this.medicationsService.search(user.pharmacyId, q);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.medicationsService.findOne(user.pharmacyId, id);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(user.pharmacyId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return this.medicationsService.update(user.pharmacyId, id, dto, user.id);
  }

  @Post('import')
  @RequirePermissions(Permission.CREATE)
  @UseInterceptors(FileInterceptor('file'))
  importExcel(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File) {
    return this.medicationsService.importFromExcel(user.pharmacyId, file.buffer, user.id);
  }

  @Get('export/excel')
  @RequirePermissions(Permission.VIEW)
  async exportExcel(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const buffer = await this.medicationsService.exportToExcel(user.pharmacyId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="medications.xlsx"',
    });
    res.send(buffer);
  }
}
