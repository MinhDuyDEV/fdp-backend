export interface ReaderObserver {
  update(message: string): void;
}

export class ChapterUpdateSubject {
  private readonly observers = new Set<ReaderObserver>();

  attach(observer: ReaderObserver): void {
    this.observers.add(observer);
  }

  detach(observer: ReaderObserver): void {
    this.observers.delete(observer);
  }

  notify(message: string): void {
    for (const observer of this.observers) {
      observer.update(message);
    }
  }
}

export class InAppReaderObserver implements ReaderObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_message: string): void {}
}
