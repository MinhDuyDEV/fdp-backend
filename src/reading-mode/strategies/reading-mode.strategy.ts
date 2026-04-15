export interface RenderResult {
	content: string;
	mode: string;
	styles: Record<string, string>;
	metadata?: Record<string, unknown>;
}

export interface ReadingModeStrategy {
	render(content: string): RenderResult;
	getName(): string;
}
