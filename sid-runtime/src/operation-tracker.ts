/**
 * @module operation-tracker
 * 
 * Manages the lifecycle of tracked async operations in the SID runtime.
 * This module provides the OperationTracker class which creates, tracks,
 * and manages operations triggered by interactions with SID elements.
 * 
 * @packageDocumentation
 */

import type {
  Operation,
  SIDActionType,
  OperationEffects,
} from '@sid-standard/types';

/**
 * Error thrown when an operation poll times out.
 */
export class OperationTimeoutError extends Error {
  /** The ID of the operation that timed out */
  public readonly operationId: string;
  /** The timeout duration in milliseconds */
  public readonly timeoutMs: number;

  /**
   * Creates a new OperationTimeoutError.
   * 
   * @param operationId - The ID of the operation that timed out
   * @param timeoutMs - The timeout duration in milliseconds
   */
  constructor(operationId: string, timeoutMs: number) {
    super(`Operation "${operationId}" timed out after ${timeoutMs}ms`);
    this.name = 'OperationTimeoutError';
    this.operationId = operationId;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Manages the lifecycle of tracked async operations.
 * 
 * The OperationTracker class provides functionality to:
 * - Create new pending operations with unique IDs
 * - Complete operations with success or error status
 * - Retrieve operations by ID
 * - Poll operations until completion or timeout
 * - Clear all tracked operations
 * 
 * @example
 * ```typescript
 * const tracker = new OperationTracker();
 * 
 * // Start a new operation
 * const operation = tracker.start('submit-button', 'click');
 * console.log(operation.id); // "op-1"
 * console.log(operation.status); // "pending"
 * 
 * // Complete the operation
 * tracker.complete(operation.id, 'success', 'Form submitted successfully');
 * 
 * // Get the completed operation
 * const completed = tracker.get(operation.id);
 * console.log(completed?.status); // "success"
 * ```
 */
export class OperationTracker {
  /**
   * Map storing Operation objects keyed by their ID
   * @internal
   */
  private operations: Map<string, Operation> = new Map();

  /**
   * Counter for generating unique operation IDs
   * @internal
   */
  private idCounter: number = 0;

  /**
   * Creates a new pending operation and adds it to the registry.
   * 
   * The operation is created with:
   * - A unique ID in the format "op-{counter}"
   * - Status set to "pending"
   * - startedAt timestamp set to the current time
   * 
   * @param elementId - The ID of the element that triggered this operation
   * @param actionType - The type of action that triggered this operation
   * @returns The newly created Operation object
   * 
   * @example
   * ```typescript
   * const tracker = new OperationTracker();
   * 
   * const op1 = tracker.start('login-button', 'click');
   * console.log(op1.id); // "op-1"
   * console.log(op1.elementId); // "login-button"
   * console.log(op1.actionType); // "click"
   * console.log(op1.status); // "pending"
   * 
   * const op2 = tracker.start('search-input', 'fill');
   * console.log(op2.id); // "op-2"
   * ```
   */
  start(elementId: string, actionType: SIDActionType): Operation {
    this.idCounter++;
    const id = `op-${this.idCounter}`;

    const operation: Operation = {
      id,
      elementId,
      actionType,
      status: 'pending',
      startedAt: Date.now(),
    };

    this.operations.set(id, operation);
    return operation;
  }

  /**
   * Completes an operation with the specified status.
   * 
   * Updates the operation with:
   * - The new status ("success" or "error")
   * - completedAt timestamp set to the current time
   * - Optional message describing the result
   * - Optional effects describing what changed
   * 
   * If the operation is not found or already completed, a warning is logged.
   * 
   * @param id - The ID of the operation to complete
   * @param status - The completion status ("success" or "error")
   * @param message - Optional message describing the result
   * @param effects - Optional effects describing what changed
   * 
   * @example
   * ```typescript
   * const tracker = new OperationTracker();
   * const op = tracker.start('submit-btn', 'click');
   * 
   * // Complete with success
   * tracker.complete(op.id, 'success', 'Form submitted');
   * 
   * // Complete with error
   * tracker.complete(op.id, 'error', 'Validation failed');
   * 
   * // Complete with effects
   * tracker.complete(op.id, 'success', 'Navigation complete', {
   *   navigatedTo: '/dashboard',
   *   elementsAdded: ['welcome-message']
   * });
   * ```
   */
  complete(
    id: string,
    status: 'success' | 'error',
    message?: string,
    effects?: OperationEffects
  ): void {
    const operation = this.operations.get(id);

    if (!operation) {
      console.warn(`[SID] Cannot complete operation "${id}": operation not found`);
      return;
    }

    if (operation.status !== 'pending') {
      console.warn(
        `[SID] Cannot complete operation "${id}": operation already completed with status "${operation.status}"`
      );
      return;
    }

    // Update the operation in place
    operation.status = status;
    operation.completedAt = Date.now();

    if (message !== undefined) {
      operation.message = message;
    }

    if (effects !== undefined) {
      operation.effects = effects;
    }
  }

  /**
   * Retrieves an operation by its ID.
   * 
   * @param id - The ID of the operation to retrieve
   * @returns The Operation object, or null if not found
   * 
   * @example
   * ```typescript
   * const tracker = new OperationTracker();
   * const op = tracker.start('button', 'click');
   * 
   * const found = tracker.get(op.id);
   * console.log(found?.status); // "pending"
   * 
   * const notFound = tracker.get('non-existent');
   * console.log(notFound); // null
   * ```
   */
  get(id: string): Operation | null {
    return this.operations.get(id) ?? null;
  }

  /**
   * Polls an operation until it completes or times out.
   * 
   * This method returns a Promise that:
   * - Resolves with the completed Operation when status is "success" or "error"
   * - Rejects with an OperationTimeoutError if the operation doesn't complete within timeoutMs
   * - Checks the operation status every intervalMs milliseconds
   * 
   * @param id - The ID of the operation to poll
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @param intervalMs - Interval between status checks in milliseconds
   * @returns A Promise that resolves with the completed Operation
   * @throws {OperationTimeoutError} If the operation doesn't complete within timeoutMs
   * @throws {Error} If the operation is not found
   * 
   * @example
   * ```typescript
   * const tracker = new OperationTracker();
   * const op = tracker.start('submit-btn', 'click');
   * 
   * // Poll with 5 second timeout, checking every 100ms
   * try {
   *   const completed = await tracker.poll(op.id, 5000, 100);
   *   console.log(completed.status); // "success" or "error"
   * } catch (error) {
   *   if (error instanceof OperationTimeoutError) {
   *     console.log(`Operation ${error.operationId} timed out`);
   *   }
   * }
   * ```
   */
  poll(id: string, timeoutMs: number, intervalMs: number): Promise<Operation> {
    return new Promise((resolve, reject) => {
      const operation = this.operations.get(id);

      if (!operation) {
        reject(new Error(`Operation "${id}" not found`));
        return;
      }

      // If already completed, resolve immediately
      if (operation.status === 'success' || operation.status === 'error') {
        resolve(operation);
        return;
      }

      const startTime = Date.now();

      const checkStatus = (): void => {
        const currentOperation = this.operations.get(id);

        // Operation was removed
        if (!currentOperation) {
          reject(new Error(`Operation "${id}" not found`));
          return;
        }

        // Operation completed
        if (currentOperation.status === 'success' || currentOperation.status === 'error') {
          resolve(currentOperation);
          return;
        }

        // Check for timeout
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
          reject(new OperationTimeoutError(id, timeoutMs));
          return;
        }

        // Schedule next check
        setTimeout(checkStatus, intervalMs);
      };

      // Start polling
      setTimeout(checkStatus, intervalMs);
    });
  }

  /**
   * Clears all tracked operations from the registry.
   * 
   * This method removes all operations and resets the ID counter.
   * Use this for cleanup or when starting fresh.
   * 
   * @example
   * ```typescript
   * const tracker = new OperationTracker();
   * tracker.start('btn1', 'click');
   * tracker.start('btn2', 'click');
   * 
   * console.log(tracker.get('op-1')); // Operation object
   * 
   * tracker.clear();
   * 
   * console.log(tracker.get('op-1')); // null
   * ```
   */
  clear(): void {
    this.operations.clear();
    // Note: We don't reset idCounter to ensure IDs remain unique
    // even after clearing. This prevents potential ID collisions
    // if operations are created, cleared, and created again.
  }
}
