/**
 * @sid-standard/runtime
 * 
 * Runtime library implementing the window.SID API for the 
 * SID (Semantic Interaction Description) standard.
 * 
 * @packageDocumentation
 */

// Re-export types from @sid-standard/types
export type {
  SIDElement,
  ActionDefinition,
  InteractionAction,
  InteractionResult,
  Operation,
  OperationTracking,
  OperationEffects,
  HumanInputRequirement,
  SIDAPI,
  SIDActionType,
  SIDInputDataType,
  SIDTrackingType,
  SIDOperationStatus,
  InputDefinition,
  ElementState,
  OperationHandle,
  SIDAuth,
  JSONSchema,
  UIHints,
} from '@sid-standard/types';

// Export attribute parser functions and types
export {
  parseAttributes,
  parseInputAttribute,
  parseHumanInputAttribute,
} from './attribute-parser';
export type { ParsedAttributes } from './attribute-parser';

// Export context parser functions and types
export {
  getAppContext,
  getPageContext,
  getAuthDescription,
  getContextMetadata,
  clearContextCache,
} from './context-parser';
export type { SIDContextMetadata } from './context-parser';

// Export element registry
export { ElementRegistry } from './element-registry';

// Export operation tracker
export { OperationTracker, OperationTimeoutError } from './operation-tracker';

// Export interaction executor
export { InteractionExecutor } from './interaction-executor';

// Export SID API implementation
export { SIDAPIImpl } from './sid-api';
export type { SIDAPIOptions } from './sid-api';

import type { SIDAPI } from '@sid-standard/types';
import { SIDAPIImpl } from './sid-api';

/**
 * The current SID API instance, if initialized.
 * @internal
 */
let currentInstance: SIDAPIImpl | null = null;

/**
 * Configuration options for initializing the SID runtime
 */
export interface SIDRuntimeOptions {
  /** 
   * Enable MutationObserver for dynamic element discovery.
   * @default true
   */
  observeDOM?: boolean;
  
  /** 
   * Authentication configuration for agent authentication support
   */
  auth?: {
    /** Description of the authentication method */
    description: string;
    /** Callback function to authenticate with a token */
    authenticate: (token: string) => Promise<boolean>;
  };
}

/**
 * Initialize the SID runtime and expose window.SID
 * 
 * @param options - Configuration options for the runtime
 * @returns The SIDAPI instance
 * 
 * @example
 * ```typescript
 * import { init } from '@sid-standard/runtime';
 * 
 * // Basic initialization
 * const sid = init();
 * 
 * // With options
 * const sid = init({
 *   observeDOM: true,
 *   auth: {
 *     description: 'Bearer token authentication',
 *     authenticate: async (token) => {
 *       // Validate token
 *       return true;
 *     }
 *   }
 * });
 * ```
 */
export function init(options?: SIDRuntimeOptions): SIDAPI {
  // If already initialized, warn and return existing instance
  if (currentInstance && typeof window !== 'undefined' && window.SID) {
    console.warn('[SID] Runtime already initialized. Returning existing instance.');
    return currentInstance;
  }

  // Create new SID API instance
  currentInstance = new SIDAPIImpl({
    observeDOM: options?.observeDOM ?? true,
    auth: options?.auth,
  });

  // Expose on window if in browser environment
  if (typeof window !== 'undefined') {
    window.SID = currentInstance;
  }

  return currentInstance;
}

/**
 * Destroy the SID runtime and remove window.SID
 * 
 * @example
 * ```typescript
 * import { destroy } from '@sid-standard/runtime';
 * 
 * // Clean up when done
 * destroy();
 * ```
 */
export function destroy(): void {
  if (currentInstance) {
    currentInstance.destroy();
    currentInstance = null;
  }

  // Remove from window if in browser environment
  if (typeof window !== 'undefined' && window.SID) {
    delete window.SID;
  }
}
