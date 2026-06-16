import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from "./dto/emergency-contacts.dto";
import { EmergencyContactsService } from "./emergency-contacts.service";

@ApiTags("emergency-contacts")
@ApiBearerAuth()
@Controller("emergency-contacts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmergencyContactsController {
  constructor(private readonly emergencyContactsService: EmergencyContactsService) {}

  @Get("me")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List current user's emergency contacts" })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.emergencyContactsService.listMine(user.sub));
  }

  @Post()
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Create emergency contact" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmergencyContactDto) {
    return ok(this.emergencyContactsService.create(user.sub, dto));
  }

  @Patch(":id")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Update emergency contact" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateEmergencyContactDto) {
    return ok(this.emergencyContactsService.update(user.sub, id, dto));
  }

  @Delete(":id")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Delete emergency contact" })
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.emergencyContactsService.remove(user.sub, id));
  }
}
