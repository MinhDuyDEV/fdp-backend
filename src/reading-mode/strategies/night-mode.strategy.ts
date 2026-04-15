import { Injectable } from "@nestjs/common";
import type {
	ReadingModeStrategy,
	RenderResult,
} from "./reading-mode.strategy";

@Injectable()
export class NightModeStrategy implements ReadingModeStrategy {
	render(content: string): RenderResult {
		return {
			content,
			mode: "night",
			styles: {
				backgroundColor: "#1a1a2e",
				color: "#e0e0e0",
				fontFamily: "Georgia, serif",
				lineHeight: "1.8",
				padding: "2rem",
				filter: "brightness(0.9)",
			},
		};
	}

	getName(): string {
		return "night";
	}
}
