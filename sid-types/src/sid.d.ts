/**
 * SID (Semantic Interaction Description) Core Type Definitions
 * 
 * This module contains all the core interfaces and types for the SID standard.
 * These types define the structure of SID elements, actions, operations, and the global API.
 */

/**
 * Action types supported by SID elements
 */
export type SIDActionType = "click" | "fill" | "select" | "check" | "hover" | "upload";

/**
 * Input data types for fill/select actions
 */
export type SIDInputDataType = "text" | "number" | "date" | "email" | "password" | "file";

/**
 * Operation tracking types
 * - async: Asynchronous operations that require waiting for completion (API calls, form submissions)
 * - navigation: Full page navigation
 * - external: External context (OAuth, payment gateways)
 * - none: Instant actions (hover, focus)
 */
export type SIDTrackingType = "async" | "navigation" | "external" | "none";

/**
 * Interaction result status values
 */
export type SIDInteractionStatus = "completed" | "error" | "timeout" | "navigation" | "external";

/**
 * Operation status values (deprecated - use SIDInteractionStatus)
 * @deprecated Use SIDInteractionStatus instead
 */
export type SIDOperationStatus = "pending" | "success" | "error";

/**
 * Represents an interactive element with SID metadata
 */
export interface SIDElement {
  /** Unique identifier from data-sid attribute */
  id: string;
  /** CSS selector to locate the DOM element */
  selector: string;
  /** Short description from data-sid-desc */
  description: string;
  /** Detailed description from data-sid-desc-long */
  descriptionLong?: string;
  /** Available actions for this element */
  actions: ActionDefinition[];
  /** Current element state */
  state?: ElementState;
  /** Whether the element is disabled */
  disabled: boolean;
  /** Explanation of why element is disabled */
  disabledDescription?: string;
  /** Human input requirement for sensitive data */
  humanInput?: HumanInputRequirement;
}

/**
 * Defines an action that can be performed on an element
 */
export interface ActionDefinition {
  /** The type of action */
  type: SIDActionType;
  /** Input configuration for fill/select actions */
  input?: InputDefinition;
  /** Whether this action produces a trackable operation */
  tracked: boolean;
  /** Description of what this action does */
  description: string;
}

/**
 * Input configuration for actions requiring values
 */
export interface InputDefinition {
  /** The expected data type */
  dataType: SIDInputDataType;
  /** Whether input is required */
  required: boolean;
  /** Available options for select actions */
  options?: string[];
}

/**
 * Current state of an element
 */
export interface ElementState {
  /** Whether element is visible in viewport */
  visible: boolean;
  /** Whether element is enabled for interaction */
  enabled: boolean;
  /** Current value (for inputs) */
  value?: string;
}

/**
 * Action to perform on an element
 */
export interface InteractionAction {
  /** The action type to perform */
  type: SIDActionType;
  /** Value for fill/select/check actions */
  value?: string | number | boolean | File;
}

/**
 * Options for the interact method
 */
export interface InteractionOptions {
  /** Timeout in milliseconds for tracked operations (default: 30000) */
  timeout?: number;
}

/**
 * Result of an interaction attempt
 * 
 * The interact() method now waits for operation completion and returns the final result.
 * No polling is required - the result contains the final status.
 */
export interface InteractionResult {
  /** Whether the interaction was triggered successfully */
  success: boolean;
  /** The final status of the interaction */
  status: SIDInteractionStatus;
  /** Error message if interaction failed */
  error?: string;
  /** Description of what happened */
  message?: string;
  /** Effects of the completed operation (for 'completed' status) */
  effects?: OperationEffects;
}

/**
 * Result passed to SID.complete() by app code
 */
export interface CompletionResult {
  /** The completion status */
  status: "completed" | "error";
  /** Description of what happened */
  message?: string;
  /** Effects of the completed operation */
  effects?: OperationEffects;
}

/**
 * Handle to a tracked operation (deprecated)
 * @deprecated Operations are now handled internally by interact()
 */
export interface OperationHandle {
  /** Unique operation identifier */
  id: string;
  /** How to track this operation */
  tracking: OperationTracking;
}

/**
 * Operation tracking configuration (internal use)
 */
export type OperationTracking =
  | { type: "async" }
  | { type: "navigation"; destination?: string }
  | { type: "external"; description: string }
  | { type: "none" };

/**
 * A tracked async operation (deprecated - internal use only)
 * @deprecated Use InteractionResult instead
 */
export interface Operation {
  /** Unique operation identifier */
  id: string;
  /** ID of the element that triggered this operation */
  elementId: string;
  /** The action type that triggered this operation */
  actionType: SIDActionType;
  /** Current operation status */
  status: SIDOperationStatus;
  /** Status message */
  message?: string;
  /** Timestamp when operation started */
  startedAt: number;
  /** Timestamp when operation completed */
  completedAt?: number;
  /** Effects of the completed operation */
  effects?: OperationEffects;
}

/**
 * Effects produced by a completed operation
 */
export interface OperationEffects {
  /** URL navigated to */
  navigatedTo?: string;
  /** IDs of elements added to the page */
  elementsAdded?: string[];
  /** IDs of elements removed from the page */
  elementsRemoved?: string[];
  /** Description of other changes */
  changes?: string;
}

/**
 * Requirement for human input on sensitive data
 */
export interface HumanInputRequirement {
  /** Explanation of why human input is needed */
  reason: string;
  /** JSON Schema describing required input */
  schema: JSONSchema;
  /** UI hints for rendering the input form */
  uiHints?: UIHints;
}

/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema & { 
    title?: string; 
    format?: string;
    "x-sid-sensitive"?: boolean;
  }>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * UI hints for human input forms
 */
export interface UIHints {
  /** Form title */
  title?: string;
  /** Sections to organize fields */
  sections?: Array<{
    title: string;
    fields: string[];
  }>;
}

/**
 * Authentication configuration
 */
export interface SIDAuth {
  /** Description of authentication method */
  description: string;
  /** Authenticate with a token */
  authenticate(token: string): Promise<boolean>;
}

/**
 * The global SID API
 */
export interface SIDAPI {
  /** SID specification version */
  version: string;
  
  /** Check if SID is supported on this page */
  isSupported(): boolean;
  
  /** Get the page context description */
  getPageContext(): string;
  
  /** Get the application context description */
  getAppContext(): string;
  
  /** Get all SID elements on the page */
  getElements(): SIDElement[];
  
  /** Get a specific SID element by ID */
  getElement(id: string): SIDElement | null;
  
  /** 
   * Interact with an element and wait for completion
   * 
   * This method triggers the action and waits for the operation to complete
   * (or timeout). No polling is required - the result contains the final status.
   * 
   * @param id - The element ID to interact with
   * @param action - The action to perform
   * @param options - Optional settings including timeout
   * @returns The final interaction result
   */
  interact(id: string, action: InteractionAction, options?: InteractionOptions): Promise<InteractionResult>;
  
  /**
   * Signal completion of an operation (called by app code)
   * 
   * App developers call this method to signal that an async operation
   * triggered by an interaction has completed.
   * 
   * @param elementId - The element ID that triggered the operation
   * @param result - The completion result
   */
  complete(elementId: string, result: CompletionResult): void;
  
  /** 
   * Get an operation by ID (deprecated)
   * @deprecated Operations are now handled internally by interact()
   */
  getOperation(id: string): Operation | null;
  
  /** 
   * Poll an operation until completion or timeout (deprecated)
   * @deprecated Use interact() with timeout option instead
   */
  pollOperation(id: string, timeoutMs?: number, intervalMs?: number): Promise<Operation>;
  
  /** Authentication (optional) */
  auth?: SIDAuth;
}
