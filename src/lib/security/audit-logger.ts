import prisma from '@/lib/utils/prisma';

export class AuditLogger {
  /**
   * Log admin action
   */
  async logAction(data: {
    adminId: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes ? JSON.stringify(data.changes) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(params: {
    adminId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { adminId, entity, entityId, action, startDate, endDate, page = 1, limit = 50 } = params;

    const where: any = {};
    if (adminId) where.adminId = adminId;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Log sensitive operations
   */
  async logSensitiveOperation(data: {
    adminId: string;
    operation: string;
    details: any;
  }) {
    return this.logAction({
      adminId: data.adminId,
      action: data.operation,
      entity: 'SENSITIVE_OPERATION',
      entityId: 'N/A',
      changes: data.details,
    });
  }

  /**
   * Get audit trail for certificate
   */
  async getCertificateAuditTrail(certificateId: string) {
    return prisma.auditLog.findMany({
      where: {
        entity: 'CERTIFICATE',
        entityId: certificateId,
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}