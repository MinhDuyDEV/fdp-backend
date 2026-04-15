import { BadRequestException, Injectable } from "@nestjs/common";
import type { DayModeStrategy } from "./day-mode.strategy";
import type { NightModeStrategy } from "./night-mode.strategy";
import type { PageFlipModeStrategy } from "./page-flip-mode.strategy";
import type {
	ReadingModeStrategy,
	RenderResult,
} from "./reading-mode.strategy";
import type { ScrollModeStrategy } from "./scroll-mode.strategy";

/**
 * Strategy Pattern: ReadingModeContext
 *
 * Holds the current reading-mode strategy and dispatches render calls.
 * Unlike a bare context class, this is a NestJS @Injectable() that
 * receives all concrete strategies via DI and selects at runtime.
 */
@Injectable()
export class ReadingModeContext {
	private strategy: ReadingModeStrategy;
	private readonly strategyMap: Map<string, ReadingModeStrategy>;

	constructor(
		private readonly dayStrategy: DayModeStrategy,
		private readonly nightStrategy: NightModeStrategy,
		private readonly scrollStrategy: ScrollModeStrategy,
		private readonly pageFlipStrategy: PageFlipModeStrategy,
	) {
		this.strategy = dayStrategy; // default
		this.strategyMap = new Map<string, ReadingModeStrategy>([
			["day", dayStrategy],
			["night", nightStrategy],
			["scroll", scrollStrategy],
			["page-flip", pageFlipStrategy],
		]);
	}

	setStrategy(modeName: string): void {
		const strategy = this.strategyMap.get(modeName);
		if (!strategy) {
			throw new BadRequestException(`Unknown reading mode: ${modeName}`);
		}
		this.strategy = strategy;
	}

	render(content: string): RenderResult {
		return this.strategy.render(content);
	}

	getCurrentMode(): string {
		return this.strategy.getName();
	}

	getAvailableModes(): string[] {
		return Array.from(this.strategyMap.keys());
	}
}
