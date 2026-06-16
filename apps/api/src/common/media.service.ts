import { Injectable } from "@nestjs/common";

type MediaLike = {
  id: string;
  url: string;
  fileSize?: number | null;
  createdAt?: Date;
  mediaType?: string | null;
  evidenceType?: string | null;
};

@Injectable()
export class MediaService {
  normalizeList(media: MediaLike[], fallbackType: "image" | "video" | "file" = "image") {
    return media.map((item) => this.normalizeItem(item, fallbackType));
  }

  normalizeItem(item: MediaLike, fallbackType: "image" | "video" | "file" = "image") {
    return {
      id: item.id,
      url: item.url,
      type: item.mediaType ?? item.evidenceType ?? fallbackType,
      size: item.fileSize ?? null,
      createdAt: item.createdAt ?? null
    };
  }
}
