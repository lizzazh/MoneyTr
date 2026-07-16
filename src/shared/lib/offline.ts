export class OfflineActionError extends Error {
  constructor() {
    super("Для цієї дії потрібне з'єднання з інтернетом");
    this.name = "OfflineActionError";
  }
}

export function assertOnline(): void {
  if (!navigator.onLine) {
    throw new OfflineActionError();
  }
}
