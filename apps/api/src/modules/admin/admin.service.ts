import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [users, activeUsers, organizerCount, orders, releasedPayments, refunds, sosEvents, disputes] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: null }
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.user.count({
        where: {
          role: "organizer",
          deletedAt: null
        }
      }),
      this.prisma.order.findMany(),
      this.prisma.payment.findMany({
        where: { status: "released" }
      }),
      this.prisma.refund.findMany(),
      this.prisma.sosEvent.count(),
      this.prisma.dispute.count({
        where: { deletedAt: null }
      })
    ]);

    const gmv = releasedPayments.reduce((sum, item) => sum + Number(item.amount), 0);
    const refundRate = orders.length ? Number(((refunds.filter((item) => item.status === "completed").length / orders.length) * 100).toFixed(2)) : 0;
    const complaintRate = orders.length ? Number(((disputes / orders.length) * 100).toFixed(2)) : 0;

    return {
      totalUsers: users,
      activeUsers,
      organizerCount,
      orders: orders.length,
      gmv: Number(gmv.toFixed(2)),
      refundRate,
      complaintRate,
      sosEvents,
      disputes
    };
  }

  users() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        profile: true
      }
    });
  }

  organizers() {
    return this.prisma.user.findMany({
      where: { role: "organizer", deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        organizerProfile: {
          include: {
            tags: true
          }
        },
        organizerDeposits: true
      }
    });
  }

  orders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          include: {
            profile: true
          }
        },
        organizer: {
          include: {
            profile: true
          }
        },
        serviceContract: true,
        payments: {
          orderBy: { createdAt: "desc" }
        },
        escrowAccount: true,
        refunds: true,
        breachRecords: true,
        sosEvents: true,
        disputes: true
      }
    });
  }

  disputes() {
    return this.prisma.dispute.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        order: true,
        initiator: { include: { profile: true } },
        respondent: { include: { profile: true } },
        messages: true,
        evidences: true
      }
    });
  }

  sosEvents() {
    return this.prisma.sosEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        user: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });
  }

  async riskSummary() {
    const [riskUsers, riskOrganizers, complaints, sosCount, highRiskOrders] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: "client",
          deletedAt: null,
          OR: [{ safetyScore: { lt: 100 } }, { status: "banned" }]
        }
      }),
      this.prisma.user.count({
        where: {
          role: "organizer",
          deletedAt: null,
          OR: [{ safetyScore: { lt: 100 } }, { status: "banned" }]
        }
      }),
      this.prisma.dispute.count({
        where: { deletedAt: null }
      }),
      this.prisma.sosEvent.count(),
      this.prisma.order.count({
        where: {
          OR: [{ status: "disputed" }, { sosEvents: { some: {} } }]
        }
      })
    ]);

    return {
      riskUsers,
      riskOrganizers,
      complaintCount: complaints,
      sosCount,
      highRiskOrders
    };
  }

  riskUsers() {
    return this.prisma.user.findMany({
      where: {
        role: "client",
        deletedAt: null,
        OR: [{ safetyScore: { lt: 100 } }, { status: "banned" }]
      },
      orderBy: [{ safetyScore: "asc" }, { updatedAt: "desc" }],
      include: {
        profile: true,
        disputesInitiated: true,
        sosEventsTriggered: true
      }
    });
  }

  riskOrganizers() {
    return this.prisma.user.findMany({
      where: {
        role: "organizer",
        deletedAt: null,
        OR: [{ safetyScore: { lt: 100 } }, { status: "banned" }]
      },
      orderBy: [{ safetyScore: "asc" }, { updatedAt: "desc" }],
      include: {
        profile: true,
        organizerProfile: true,
        disputesResponded: true,
        sosEventsAsOrganizer: true
      }
    });
  }

  riskOrders() {
    return this.prisma.order.findMany({
      where: {
        OR: [{ status: "disputed" }, { sosEvents: { some: {} } }]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: { include: { profile: true } },
        organizer: { include: { profile: true } },
        sosEvents: true,
        disputes: true
      }
    });
  }

  async financeSummary() {
    const [escrows, releasedPayments, transactions] = await Promise.all([
      this.prisma.escrowAccount.findMany(),
      this.prisma.payment.findMany({
        where: { status: "released" }
      }),
      this.prisma.transaction.findMany({
        where: {
          type: "commission"
        }
      })
    ]);

    return {
      totalEscrow: Number(escrows.filter((item) => item.status === "holding").reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)),
      totalSettled: Number(releasedPayments.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)),
      totalCommission: Number(
        transactions.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0).toFixed(2)
      )
    };
  }

  auditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          include: {
            profile: true
          }
        }
      }
    });
  }
}
