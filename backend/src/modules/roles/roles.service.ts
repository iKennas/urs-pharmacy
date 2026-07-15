import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { AuditLogService } from '../../common/audit-log.service';
import { DEFAULT_ROLES } from './default-roles';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Called once when a new pharmacy is provisioned (see SubscriptionsService.createPharmacy). */
  async seedDefaultRoles(pharmacyId: string) {
    await this.prisma.role.createMany({
      data: DEFAULT_ROLES.map((r) => ({ pharmacyId, name: r.name, permissions: r.permissions, isSystem: true })),
    });
    return this.prisma.role.findMany({ where: { pharmacyId } });
  }

  list(pharmacyId: string) {
    return this.prisma.role.findMany({ where: { pharmacyId }, orderBy: { createdAt: 'asc' } });
  }

  async create(pharmacyId: string, dto: CreateRoleDto, userId: string) {
    const role = await this.prisma.role.create({ data: { pharmacyId, name: dto.name, permissions: dto.permissions } });
    await this.auditLog.record({ pharmacyId, userId, action: 'ROLE_CREATED', entityType: 'Role', entityId: role.id, metadata: dto });
    return role;
  }

  async updatePermissions(pharmacyId: string, roleId: string, dto: UpdateRoleDto, userId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.pharmacyId !== pharmacyId) throw new NotFoundException('الدور غير موجود');

    const updated = await this.prisma.role.update({ where: { id: roleId }, data: { permissions: dto.permissions } });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'Role',
      entityId: roleId,
      metadata: dto,
    });
    return updated;
  }

  async remove(pharmacyId: string, roleId: string, userId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, include: { _count: { select: { users: true } } } });
    if (!role || role.pharmacyId !== pharmacyId) throw new NotFoundException('الدور غير موجود');
    if (role.isSystem) throw new BadRequestException('لا يمكن حذف الأدوار الافتراضية للنظام');
    if (role._count.users > 0) throw new BadRequestException('لا يمكن حذف دور مرتبط بمستخدمين حاليين');

    await this.prisma.role.delete({ where: { id: roleId } });
    await this.auditLog.record({ pharmacyId, userId, action: 'ROLE_DELETED', entityType: 'Role', entityId: roleId });
    return { message: 'تم حذف الدور' };
  }
}
