export interface ReadingModeStrategy {
  render(content: string): string;
  getName(): string;
}
