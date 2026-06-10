/**
 * Simple asynchronous task queue for background processing.
 */
export class TaskQueue {
  private static instance: TaskQueue;
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  private constructor() {}

  public static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  /**
   * Enqueues a task for asynchronous execution.
   */
  public enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    this.process();
  }

  /**
   * Processes the queue one task at a time.
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Task execution failed:', error);
        }
      }
    }

    this.processing = false;
  }
}

export const taskQueue = TaskQueue.getInstance();
