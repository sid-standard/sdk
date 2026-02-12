/**
 * @module interaction-executor
 * 
 * Executes interactions on SID-annotated DOM elements.
 * This module provides the InteractionExecutor class which handles
 * dispatching actions to elements and triggering appropriate DOM events.
 * 
 * The executor now waits for operation completion internally, eliminating
 * the need for external polling.
 * 
 * @packageDocumentation
 */

import type {
  InteractionAction,
  InteractionResult,
  InteractionOptions,
  CompletionResult,
  SIDTrackingType,
  OperationEffects,
  SIDInteractionStatus,
} from '@sid-standard/types';

import { ElementRegistry } from './element-registry';
import { parseAttributes } from './attribute-parser';

/**
 * Default timeout for tracked operations in milliseconds.
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Pending operation resolver
 * @internal
 */
interface PendingOperation {
  resolve: (result: { status: SIDInteractionStatus; message?: string; effects?: OperationEffects }) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Executes interactions on SID-annotated DOM elements.
 * 
 * The executor now handles operation completion internally. When an interaction
 * is triggered on a tracked element, the executor waits for the app to call
 * SID.complete() or for the timeout to expire.
 */
export class InteractionExecutor {
  /**
   * Map of pending operations keyed by element ID
   * @internal
   */
  public pendingOperations: Map<string, PendingOperation> = new Map();

  constructor(
    private registry: ElementRegistry
  ) {}

  /**
   * Executes an interaction on a SID element and waits for completion.
   * 
   * @param id - The element ID to interact with
   * @param action - The action to perform
   * @param options - Optional settings including timeout
   * @returns The final interaction result
   */
  async execute(
    id: string, 
    action: InteractionAction, 
    options: InteractionOptions = {}
  ): Promise<InteractionResult> {
    const { timeout = DEFAULT_TIMEOUT_MS } = options;
    
    const sidElement = this.registry.get(id);

    if (!sidElement) {
      return { success: false, status: 'error', error: `Element not found: ${id}` };
    }

    if (sidElement.disabled) {
      const errorMessage = sidElement.disabledDescription
        ? `Element is disabled: ${sidElement.disabledDescription}`
        : `Element is disabled: ${id}`;
      return { success: false, status: 'error', error: errorMessage };
    }

    const domElement = document.querySelector<HTMLElement>(sidElement.selector);
    if (!domElement) {
      return { success: false, status: 'error', error: `Element not found in DOM: ${id}` };
    }

    // Get tracking type from attributes
    const attrs = parseAttributes(domElement);
    const trackingType: SIDTrackingType = attrs?.tracking || 'async';

    // For 'none' tracking, just trigger and return immediately
    if (trackingType === 'none') {
      try {
        this.triggerAction(domElement, action);
        return { success: true, status: 'completed', message: `${action.type} executed on ${id}` };
      } catch (error) {
        return { 
          success: false, 
          status: 'error', 
          error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }

    // For 'navigation' tracking, trigger and return navigation status
    if (trackingType === 'navigation') {
      try {
        this.triggerAction(domElement, action);
        return { 
          success: true, 
          status: 'navigation', 
          message: attrs?.destination || 'Navigation triggered'
        };
      } catch (error) {
        return { 
          success: false, 
          status: 'error', 
          error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }

    // For 'external' tracking, trigger and return external status
    if (trackingType === 'external') {
      try {
        this.triggerAction(domElement, action);
        return { 
          success: true, 
          status: 'external', 
          message: sidElement.description || 'External operation triggered'
        };
      } catch (error) {
        return { 
          success: false, 
          status: 'error', 
          error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }

    // For 'poll' tracking, wait for completion or timeout
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.pendingOperations.delete(id);
        resolve({ 
          success: true, 
          status: 'timeout', 
          message: `Operation timed out after ${timeout}ms` 
        });
      }, timeout);

      // Store the resolver so app can complete it via SID.complete()
      this.pendingOperations.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          this.pendingOperations.delete(id);
          resolve({ success: true, ...result });
        },
        timeoutId
      });

      // Trigger the action
      try {
        this.triggerAction(domElement, action);
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingOperations.delete(id);
        resolve({ 
          success: false, 
          status: 'error', 
          error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}` 
        });
      }
    });
  }

  /**
   * Completes a pending operation (called by app code via SID.complete())
   * 
   * @param elementId - The element ID that triggered the operation
   * @param result - The completion result
   */
  complete(elementId: string, result: CompletionResult): void {
    const pending = this.pendingOperations.get(elementId);
    if (pending) {
      pending.resolve({
        status: result.status,
        message: result.message,
        effects: result.effects
      });
    }
  }

  /**
   * Triggers the appropriate DOM action on an element
   * @internal
   */
  private triggerAction(domElement: HTMLElement, action: InteractionAction): void {
    switch (action.type) {
      case 'click':
        this.executeClick(domElement);
        break;
      case 'fill':
        if (!(domElement instanceof HTMLInputElement || domElement instanceof HTMLTextAreaElement)) {
          throw new Error('Element is not a fillable input element');
        }
        this.executeFill(domElement, String(action.value ?? ''));
        break;
      case 'select':
        if (!(domElement instanceof HTMLSelectElement)) {
          throw new Error('Element is not a select element');
        }
        this.executeSelect(domElement, String(action.value ?? ''));
        break;
      case 'check':
        if (!(domElement instanceof HTMLInputElement)) {
          throw new Error('Element is not a checkable input element');
        }
        this.executeCheck(domElement, Boolean(action.value));
        break;
      case 'hover':
        this.executeHover(domElement);
        break;
      case 'upload':
        if (!(domElement instanceof HTMLInputElement) || domElement.type !== 'file') {
          throw new Error('Element is not a file input element');
        }
        if (!(action.value instanceof File)) {
          throw new Error('Upload action requires a File value');
        }
        this.executeUpload(domElement, action.value);
        break;
      default:
        throw new Error(`Invalid action type: ${(action as InteractionAction).type}`);
    }
  }

  private executeClick(el: HTMLElement): void {
    el.click();
  }

  private executeFill(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  private executeSelect(el: HTMLSelectElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  private executeCheck(el: HTMLInputElement, checked: boolean): void {
    el.checked = checked;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  private executeHover(el: HTMLElement): void {
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: false, view: window }));
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
  }

  private executeUpload(el: HTMLInputElement, file: File): void {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    el.files = dataTransfer.files;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }
}
