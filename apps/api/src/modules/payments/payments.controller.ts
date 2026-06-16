import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { CreateBreachRecordDto, CreateRefundDto, MockPayDto, ReviewRefundDto } from "./dto/payments.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("orders/:id/payments/mock-pay")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Mock pay an order and move funds into escrow" })
  mockPay(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: MockPayDto) {
    return ok(this.paymentsService.mockPay(user, id, dto));
  }

  @Get("orders/:id/payments")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List payments for an order" })
  getOrderPayments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.getOrderPayments(user, id));
  }

  @Get("orders/:id/escrow")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Get escrow account by order" })
  getEscrowByOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.getEscrowByOrder(user, id));
  }

  @Post("orders/:id/escrow/release")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Release escrow after observation period" })
  releaseEscrow(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.releaseEscrow(user, id));
  }

  @Post("orders/:id/refunds")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Create refund request for an order" })
  createRefund(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateRefundDto) {
    return ok(this.paymentsService.createRefundRequest(user, id, dto));
  }

  @Get("orders/:id/refunds")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List refunds by order" })
  listRefundsByOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.listRefundsByOrder(user, id));
  }

  @Get("orders/:id/breach-records")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List breach records by order" })
  listBreachRecordsByOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.listBreachRecordsByOrder(user, id));
  }

  @Post("admin/refunds/:id/review")
  @Roles("admin")
  @ApiOperation({ summary: "Approve or reject a refund" })
  reviewRefund(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReviewRefundDto) {
    return ok(this.paymentsService.reviewRefund(user, id, dto));
  }

  @Post("admin/refunds/:id/complete")
  @Roles("admin")
  @ApiOperation({ summary: "Complete an approved refund and update ledger" })
  completeRefund(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.paymentsService.completeRefund(user, id));
  }

  @Post("admin/orders/:id/breach-records")
  @Roles("admin")
  @ApiOperation({ summary: "Create breach record for an order" })
  createBreachRecord(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateBreachRecordDto) {
    return ok(this.paymentsService.createBreachRecord(user, id, dto));
  }

  @Post("admin/escrows/process-due")
  @Roles("admin")
  @ApiOperation({ summary: "Process all due escrow releases" })
  processDueEscrows() {
    return ok(this.paymentsService.processDueReleases());
  }

  @Get("admin/payments")
  @Roles("admin")
  @ApiOperation({ summary: "List all payments" })
  listPayments() {
    return ok(this.paymentsService.listPayments());
  }

  @Get("admin/escrows")
  @Roles("admin")
  @ApiOperation({ summary: "List all escrow accounts" })
  listEscrows() {
    return ok(this.paymentsService.listEscrows());
  }

  @Get("admin/refunds")
  @Roles("admin")
  @ApiOperation({ summary: "List all refunds" })
  listRefunds() {
    return ok(this.paymentsService.listRefunds());
  }

  @Get("admin/breach-records")
  @Roles("admin")
  @ApiOperation({ summary: "List all breach records" })
  listBreachRecords() {
    return ok(this.paymentsService.listBreachRecords());
  }

  @Get("admin/transactions")
  @Roles("admin")
  @ApiOperation({ summary: "List all transactions" })
  listTransactions() {
    return ok(this.paymentsService.listTransactions());
  }
}
