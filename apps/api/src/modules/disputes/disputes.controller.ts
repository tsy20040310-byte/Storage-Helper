import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import {
  CreateDisputeDto,
  CreateDisputeEvidenceDto,
  CreateDisputeMessageDto,
  ResolveDisputeDto,
  SosDto,
  UpdateSosStatusDto
} from "./dto/disputes.dto";
import { DisputesService } from "./disputes.service";

@ApiTags("safety-disputes")
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post("orders/:id/sos")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Trigger SOS event for an order" })
  sos(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SosDto) {
    return ok(this.disputesService.triggerSos(user, id, dto));
  }

  @Get("orders/:id/sos-events")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List SOS events by order" })
  listSosByOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.disputesService.listSosByOrder(user, id));
  }

  @Post("orders/:id/disputes")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Create dispute for an order" })
  create(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateDisputeDto) {
    return ok(this.disputesService.createDispute(user, id, dto));
  }

  @Get("orders/:id/disputes")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List disputes by order" })
  listByOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.disputesService.listByOrder(user, id));
  }

  @Post("disputes/:id/messages")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Add dispute message" })
  createMessage(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateDisputeMessageDto) {
    return ok(this.disputesService.createMessage(user, id, dto));
  }

  @Post("disputes/:id/evidences")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Add dispute evidence" })
  createEvidence(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateDisputeEvidenceDto) {
    return ok(this.disputesService.createEvidence(user, id, dto));
  }

  @Get("admin/sos-events")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "List all SOS events for admin" })
  listAllSos() {
    return ok(this.disputesService.listAllSos());
  }

  @Patch("admin/sos-events/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Update SOS event status" })
  updateSosStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateSosStatusDto) {
    return ok(this.disputesService.updateSosStatus(user, id, dto));
  }

  @Get("admin/disputes-center")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "List all disputes for admin" })
  listAllDisputes() {
    return ok(this.disputesService.listAllDisputes());
  }

  @Patch("admin/disputes/:id/review")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Mark dispute as in review" })
  reviewDispute(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.disputesService.reviewDispute(user, id));
  }

  @Patch("admin/disputes/:id/resolve")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Resolve dispute and apply safety penalty if needed" })
  resolveDispute(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ResolveDisputeDto) {
    return ok(this.disputesService.resolveDispute(user, id, dto));
  }
}
