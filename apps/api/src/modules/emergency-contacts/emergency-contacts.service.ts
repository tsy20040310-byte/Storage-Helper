import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from "./dto/emergency-contacts.dto";

@Injectable()
export class EmergencyContactsService {
  private static readonly MAX_CONTACTS = 3;

  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "asc" }
    });
  }

  async create(userId: string, dto: CreateEmergencyContactDto) {
    const count = await this.prisma.emergencyContact.count({ where: { userId, deletedAt: null } });
    if (count >= EmergencyContactsService.MAX_CONTACTS) {
      throw new BadRequestException("At most 3 emergency contacts are allowed");
    }

    return this.prisma.emergencyContact.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        relation: dto.relation
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateEmergencyContactDto) {
    const contact = await this.prisma.emergencyContact.findUnique({ where: { id } });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException("Emergency contact not found");
    }
    if (contact.userId !== userId) {
      throw new ForbiddenException("You are not allowed to update this contact");
    }

    return this.prisma.emergencyContact.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        relation: dto.relation
      }
    });
  }

  async remove(userId: string, id: string) {
    const contact = await this.prisma.emergencyContact.findUnique({ where: { id } });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException("Emergency contact not found");
    }
    if (contact.userId !== userId) {
      throw new ForbiddenException("You are not allowed to delete this contact");
    }
    await this.prisma.emergencyContact.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
    return { id, deleted: true };
  }
}
