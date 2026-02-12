/**
 * @module sid-api
 * 
 * Main SID API implementation that composes all runtime components.
 * This module provides the SIDAPIImpl class which implements the SIDAPI interface
 * and serves as the main entry point for AI agents to interact with the page.
 * 
 * @packageDocumentation
 */

import type {
  SIDAPI,
  SIDElement,
  InteractionAction,
  InteractionResult,
  InteractionOptions,
  CompletionResult,
  Operation,
  SIDAuth,
} from '@sid-standard/types';

import { ElementRegistry } from './element-registry';
import { OperationTracker } from './operation-tracker';
import { InteractionExecutor } from './interaction-executor';
import { getAppContext, getPageContext, clearContextCache } from './context-parser';

/**
 * Default timeout for pollOperation in milliseconds (deprecated).
 * @internal
 */
const DEFAULT_POLL_TIMEOUT_MS = 30000;

/**
 * Default interval for pollOperation in milliseconds (deprecated).
 * @internal
 */
const DEFAULT_POLL_INTERVAL_MS = 100;

/**
 * Current SID specification version.
 * @internal
 */
const SID_VERSION = '1.0.0';

/**
 * Configuration options for the SIDAPIImpl class.
 */
export interface SIDAPIOptions {
  /**
   * Enable MutationObserver for dynamic element discovery.
   * @default true
   */
  observeDOM?: boolean;

  /**
   * Authentication configuration for agent authentication support.
   */
  auth?: {
    /** Description of the authentication method */
    description: string;
    /** Callback function to authenticate with a token */
    authenticate: (token: string) => Promise<boolean>;
  };
}

/**
 * Implementation of the SIDAPI interface.
 * 
 * This class composes the ElementRegistry, OperationTracker, and InteractionExecutor
 * to provide a complete implementation of the SID API. It serves as the main entry
 * point for AI agents to discover and interact with SID-annotated elements on a page.
 * 
 * @example
 * ```typescript
 * // Create a new SID API instance
 * const api = new SIDAPIImpl({ observeDOM: true });
 * 
 * // Check if SID is supported
 * console.log(api.isSupported()); // true
 * 
 * // Get all SID elements
 * const elements = api.getElements();
 * 
 * // Interact with an element and wait for completion
 * const result = await api.interact('submit-btn', { type: 'click' }, { timeout: 10000 });
 * console.log(result.status); // 'completed', 'error', 'timeout', etc.
 * 
 * // Clean up when done
 * api.destroy();
 * ```
 */
export class SIDAPIImpl implements SIDAPI {
  /**
   * SID specification version.
   */
  public readonly version: string = SID_VERSION;

  /**
   * Optional authentication support.
   */
  public readonly auth?: SIDAuth;

  /**
   * Element registry for managing SID elements.
   * @internal
   */
  private readonly registry: ElementRegistry;

  /**
   * Operation tracker for managing async operations (deprecated, kept for backward compatibility).
   * @internal
   */
  private readonly tracker: OperationTracker;

  /**
   * Interaction executor for executing actions on elements.
   * @internal
   */
  private readonly executor: InteractionExecutor;

  /**
   * Creates a new SIDAPIImpl instance.
   * 
   * @param options - Configuration options for the API
   * 
   * @example
   * ```typescript
   * // Basic initialization
   * const api = new SIDAPIImpl();
   * 
   * // With DOM observation disabled
   * const api = new SIDAPIImpl({ observeDOM: false });
   * 
   * // With authentication support
   * const api = new SIDAPIImpl({
   *   auth: {
   *     description: 'Bearer token authentication',
   *     authenticate: async (token) => {
   *       // Validate token with your backend
   *       return true;
   *     }
   *   }
   * });
   * ```
   */
  constructor(options: SIDAPIOptions = {}) {
    const { observeDOM = true, auth } = options;

    // Initialize internal components
    this.registry = new ElementRegistry(observeDOM);
    this.tracker = new OperationTracker();
    this.executor = new InteractionExecutor(this.registry);

    // Set up authentication if provided
    if (auth) {
      this.auth = {
        description: auth.description,
        authenticate: auth.authenticate,
      };
    }
  }

  /**
   * Checks if SID is supported on this page.
   * 
   * This method always returns true when the SID runtime is loaded,
   * indicating that the page supports SID interactions.
   * 
   * @returns Always returns true when the runtime is loaded
   * 
   * @example
   * ```typescript
   * if (api.isSupported()) {
   *   console.log('SID is supported on this page');
   * }
   * ```
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * Gets the page context description from the SID context metadata.
   * 
   * The page context is read from the `page` property of the
   * `<script type="application/sid+json">` tag in the document.
   * 
   * @returns The page context string, or an empty string if not defined
   * 
   * @example
   * ```typescript
   * const pageContext = api.getPageContext();
   * console.log(pageContext); // "User dashboard showing account overview"
   * ```
   */
  getPageContext(): string {
    return getPageContext();
  }

  /**
   * Gets the application context description from the SID context metadata.
   * 
   * The app context is read from the `app` property of the
   * `<script type="application/sid+json">` tag in the document.
   * 
   * @returns The application context string, or an empty string if not defined
   * 
   * @example
   * ```typescript
   * const appContext = api.getAppContext();
   * console.log(appContext); // "E-commerce platform for selling electronics"
   * ```
   */
  getAppContext(): string {
    return getAppContext();
  }

  /**
   * Gets all SID elements currently registered on the page.
   * 
   * This method returns an array of all elements that have been discovered
   * with `data-sid` attributes. The registry is automatically updated when
   * DOM mutations occur (if observeDOM is enabled).
   * 
   * @returns An array of all SIDElement objects on the page
   * 
   * @example
   * ```typescript
   * const elements = api.getElements();
   * elements.forEach(el => {
   *   console.log(`${el.id}: ${el.description}`);
   * });
   * ```
   */
  getElements(): SIDElement[] {
    return this.registry.getAll();
  }

  /**
   * Gets a specific SID element by its ID.
   * 
   * The ID corresponds to the `data-sid` attribute value on the DOM element.
   * 
   * @param id - The data-sid attribute value to look up
   * @returns The SIDElement with the given ID, or null if not found
   * 
   * @example
   * ```typescript
   * const element = api.getElement('submit-button');
   * if (element) {
   *   console.log(`Found: ${element.description}`);
   *   console.log(`Actions: ${element.actions.map(a => a.type).join(', ')}`);
   * }
   * ```
   */
  getElement(id: string): SIDElement | null {
    return this.registry.get(id);
  }

  /**
   * Executes an interaction on a SID element and waits for completion.
   * 
   * This method triggers the specified action on the element and waits for the
   * operation to complete (or timeout). No polling is required - the result
   * contains the final status.
   * 
   * Supported action types are: click, fill, select, check, hover, upload.
   * 
   * @param id - The data-sid attribute value of the element to interact with
   * @param action - The action to perform on the element
   * @param options - Optional settings including timeout (default: 30000ms)
   * @returns A Promise that resolves with the final interaction result
   * 
   * @example
   * ```typescript
   * // Click a button and wait for completion
   * const result = await api.interact('submit-btn', { type: 'click' });
   * 
   * if (result.status === 'completed') {
   *   console.log('Success:', result.message);
   * } else if (result.status === 'error') {
   *   console.error('Failed:', result.error);
   * } else if (result.status === 'timeout') {
   *   console.log('Operation timed out');
   * }
   * 
   * // With custom timeout
   * const result = await api.interact('submit-btn', { type: 'click' }, { timeout: 5000 });
   * 
   * // Fill an input
   * const result = await api.interact('email-input', { 
   *   type: 'fill', 
   *   value: 'user@example.com' 
   * });
   * ```
   */
  interact(
    id: string, 
    action: InteractionAction, 
    options?: InteractionOptions
  ): Promise<InteractionResult> {
    return this.executor.execute(id, action, options);
  }

  /**
   * Signals completion of an operation (called by app code).
   * 
   * App developers call this method to signal that an async operation
   * triggered by an interaction has completed. This resolves the Promise
   * returned by interact().
   * 
   * @param elementId - The element ID that triggered the operation
   * @param result - The completion result
   * 
   * @example
   * ```typescript
   * // In app's click handler
   * async function handleSave() {
   *   try {
   *     await api.saveDocument(data);
   *     window.SID.complete('btn-save', { 
   *       status: 'completed', 
   *       message: 'Document saved',
   *       effects: { changes: 'Content updated' }
   *     });
   *   } catch (e) {
   *     window.SID.complete('btn-save', { 
   *       status: 'error', 
   *       message: e.message 
   *     });
   *   }
   * }
   * ```
   */
  complete(elementId: string, result: CompletionResult): void {
    this.executor.complete(elementId, result);
  }

  /**
   * Gets an operation by its ID.
   * 
   * @deprecated Operations are now handled internally by interact().
   * This method is kept for backward compatibility.
   * 
   * @param id - The operation ID to look up
   * @returns The Operation object, or null if not found
   */
  getOperation(id: string): Operation | null {
    return this.tracker.get(id);
  }

  /**
   * Polls an operation until it completes or times out.
   * 
   * @deprecated Use interact() with timeout option instead.
   * This method is kept for backward compatibility.
   * 
   * @param id - The operation ID to poll
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 30000)
   * @param intervalMs - Interval between status checks in milliseconds (default: 100)
   * @returns A Promise that resolves with the completed Operation
   */
  pollOperation(
    id: string,
    timeoutMs: number = DEFAULT_POLL_TIMEOUT_MS,
    intervalMs: number = DEFAULT_POLL_INTERVAL_MS
  ): Promise<Operation> {
    return this.tracker.poll(id, timeoutMs, intervalMs);
  }

  /**
   * Cleans up resources and destroys the API instance.
   * 
   * This method should be called when the API is no longer needed to:
   * - Stop the MutationObserver
   * - Clear the element registry
   * - Clear tracked operations
   * - Clear the context cache
   * 
   * @example
   * ```typescript
   * const api = new SIDAPIImpl();
   * 
   * // ... use the API ...
   * 
   * // Clean up when done
   * api.destroy();
   * ```
   */
  destroy(): void {
    this.registry.destroy();
    this.tracker.clear();
    clearContextCache();
  }
}
