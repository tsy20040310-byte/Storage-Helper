import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  overview() {
    return {
      dau: 0,
      newUsers: 0,
      orders: 0,
      gmv: 0,
      avgOrderValue: 0,
      repurchaseRate: 0
    };
  }

  users() {
    return [];
  }

  organizers() {
    return [];
  }

  orders() {
    return [];
  }

  disputes() {
    return [];
  }

  financeSummary() {
    return {
      totalEscrow: 0,
      totalSettled: 0,
      totalCommission: 0
    };
  }
}
