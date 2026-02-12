/**
 * @sid-standard/types
 * 
 * TypeScript type definitions for the SID (Semantic Interaction Description) standard.
 * This package provides type definitions for the SID API, elements, actions, and operations.
 */

// Include global Window augmentation (adds window.SID property)
import './src/global';

// Include HTML attributes augmentation (adds data-sid-* attributes to HTMLAttributes)
import './src/html';

// Export all core types from sid.d.ts
export {
  // Type aliases
  SIDActionType,
  SIDInputDataType,
  SIDTrackingType,
  SIDOperationStatus,
  SIDInteractionStatus,
  OperationTracking,
  
  // Interfaces
  SIDElement,
  ActionDefinition,
  InputDefinition,
  ElementState,
  InteractionAction,
  InteractionOptions,
  InteractionResult,
  CompletionResult,
  OperationHandle,
  Operation,
  OperationEffects,
  HumanInputRequirement,
  JSONSchema,
  UIHints,
  SIDAuth,
  SIDAPI,
} from './src/sid';
