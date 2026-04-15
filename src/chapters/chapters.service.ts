import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { NotificationsService } from "../notifications/notifications.service";
import type { PaginationQueryDto } from "../stories/dto/pagination-query.dto";
import type { CreateChapterDto } from "./dto/create-chapter.dto";
import { Chapter } from "./entities/chapter.entity";

@Injectable()
export class ChaptersService {
	constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly notificationsService: NotificationsService,
  ) {}

	async create(dto: CreateChapterDto): Promise<Chapter> {
		const chapter = this.chapterRepository.create(dto);
		const saved = await this.chapterRepository.save(chapter);

		// Observer Pattern: notify subscribers after successful chapter creation
		this.notificationsService.notifyChapterUpdate(
			dto.storyId,
			saved.id,
			saved.title,
		);

		return saved;
	}

	async findByStory(
		storyId: number,
		pagination?: PaginationQueryDto,
	): Promise<{
		data: Chapter[];
		meta: {
			totalItems: number;
			itemsPerPage: number;
			totalPages: number;
			currentPage: number;
		};
	}> {
		const page = pagination?.page ?? 1;
		const limit = pagination?.limit ?? 10;

		const [chapters, totalItems] = await this.chapterRepository.findAndCount({
			where: { storyId },
			order: { chapterNumber: "ASC" as const },
			skip: (page - 1) * limit,
			take: limit,
		});

		return {
			data: chapters,
			meta: {
				totalItems,
				itemsPerPage: limit,
				totalPages: Math.ceil(totalItems / limit),
				currentPage: page,
			},
		};
	}

	async findOne(id: number): Promise<Chapter> {
		const chapter = await this.chapterRepository.findOne({ where: { id } });
		if (!chapter) {
			throw new NotFoundException(`Chapter with id ${id} not found`);
		}
		return chapter;
	}
}
