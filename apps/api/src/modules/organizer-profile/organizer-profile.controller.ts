import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { StyleMatchingDto, UpsertOrganizerProfileDto } from "./dto/organizer-profile.dto";
import { OrganizerProfileService } from "./organizer-profile.service";

@ApiTags("organizer-profile")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizerProfileController {
  constructor(private readonly organizerProfileService: OrganizerProfileService) {}

  @Get("organizer-profile/me")
  @Roles("organizer")
  @ApiOperation({ summary: "Get current organizer profile aggregate root" })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.organizerProfileService.getMyProfile(user.sub));
  }

  @Put("organizer-profile/me")
  @Roles("organizer")
  @ApiOperation({ summary: "Upsert current organizer profile aggregate root" })
  upsertMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertOrganizerProfileDto) {
    return ok(this.organizerProfileService.upsertMyProfile(user.sub, dto));
  }

  @Get("organizers/:id/profile")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Get organizer profile aggregate root" })
  getOrganizerProfile(@Param("id") id: string) {
    return ok(this.organizerProfileService.getOrganizerProfile(id));
  }

  @Get("orders/:id/candidate-pool")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Get candidate pool for an order" })
  getCandidatePool(@Param("id") id: string) {
    return ok(this.organizerProfileService.getCandidatePool(id));
  }

  @Post("style-matching")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Run organizer style matching" })
  styleMatching(@Body() dto: StyleMatchingDto) {
    return ok(this.organizerProfileService.styleMatching(dto));
  }

  @Get("organizers/:id/showcase")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Get organizer showcase aggregate" })
  getOrganizerShowcase(@Param("id") id: string) {
    return ok(this.organizerProfileService.getOrganizerShowcase(id));
  }
}
