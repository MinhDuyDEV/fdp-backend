import { Injectable } from "@nestjs/common";
import type {
	ReadingModeStrategy,
	RenderResult,
} from "./reading-mode.strategy";

@Injectable()
export class DayModeStrategy implements ReadingModeStrategy {
	render(content: string): RenderResult {
		return {
			content,
			mode: "day",
			styles: {
				backgroundColor: "#ffffff",
				color: "#1a1a1a",
				fontFamily: "Georgia, serif",
				lineHeight: "1.8",
				padding: "2rem",
			},
		};
	}

	getName(): string {
		return "day";
	}
}
