/**
 * SID Runtime - ESM Example
 * 
 * This example demonstrates using the SID runtime with ES Modules
 * in a TypeScript/JavaScript project.
 * 
 * Requirements: 15.4, 15.5
 */

import {
  init,
  destroy,
  // Type imports
  type SIDAPI,
  type SIDElement,
  type InteractionAction,
  type InteractionResult,
  type Operation,
} from '@sid-standard/runtime';

// ============================================================================
// Basic Initialization
// ============================================================================

/**
 * Initialize the SID runtime with default options
 */
function basicInit(): SIDAPI {
  const sid = init();
  
  console.log('SID Version:', sid.version);
  console.log('SID Supported:', sid.isSupported());
  
  return sid;
}

// ============================================================================
// Initialization with Authentication
// ============================================================================

/**
 * Initialize with authentication support for AI agents
 */
function initWithAuth(): SIDAPI {
  const sid = init({
    observeDOM: true,
    auth: {
      description: 'Bearer token authentication - obtain from /api/auth/token',
      authenticate: async (token: string): Promise<boolean> => {
        // In a real app, validate the token with your backend
        console.log('Authenticating with token:', token.substring(0, 10) + '...');
        
        // Example: Validate token with API
        // const response = await fetch('/api/auth/validate', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // return response.ok;
        
        // For demo purposes, accept any non-empty token
        return token.length > 0;
      }
    }
  });
  
  return sid;
}

// ============================================================================
// Element Discovery
// ============================================================================

/**
 * Discover and list all SID-annotated elements on the page
 */
function discoverElements(sid: SIDAPI): void {
  const elements: SIDElement[] = sid.getElements();
  
  console.log(`Found ${elements.length} SID elements:`);
  
  elements.forEach((element) => {
    console.log(`\n[${element.id}]`);
    console.log(`  Description: ${element.description}`);
    console.log(`  Disabled: ${element.disabled}`);
    console.log(`  Actions: ${element.actions.map(a => a.type).join(', ')}`);
    
    if (element.descriptionLong) {
      console.log(`  Long Description: ${element.descriptionLong}`);
    }
    
    if (element.humanInput) {
      console.log(`  Human Input Required: ${element.humanInput.reason}`);
    }
  });
}

/**
 * Get a specific element by ID
 */
function getElementById(sid: SIDAPI, id: string): SIDElement | null {
  const element = sid.getElement(id);
  
  if (element) {
    console.log(`Found element: ${element.id}`);
    console.log(`  Description: ${element.description}`);
    return element;
  } else {
    console.log(`Element not found: ${id}`);
    return null;
  }
}

// ============================================================================
// Interactions
// ============================================================================

/**
 * Click an element
 */
async function clickElement(sid: SIDAPI, elementId: string): Promise<InteractionResult> {
  console.log(`Clicking element: ${elementId}`);
  
  const action: InteractionAction = { type: 'click' };
  const result = await sid.interact(elementId, action);
  
  if (result.success) {
    console.log('Click successful:', result.message);
  } else {
    console.error('Click failed:', result.error);
  }
  
  return result;
}

/**
 * Fill an input field with a value
 */
async function fillInput(
  sid: SIDAPI, 
  elementId: string, 
  value: string
): Promise<InteractionResult> {
  console.log(`Filling ${elementId} with: ${value}`);
  
  const action: InteractionAction = { type: 'fill', value };
  const result = await sid.interact(elementId, action);
  
  if (result.success) {
    console.log('Fill successful');
  } else {
    console.error('Fill failed:', result.error);
  }
  
  return result;
}

/**
 * Select an option from a dropdown
 */
async function selectOption(
  sid: SIDAPI, 
  elementId: string, 
  option: string
): Promise<InteractionResult> {
  console.log(`Selecting "${option}" in ${elementId}`);
  
  const action: InteractionAction = { type: 'select', value: option };
  const result = await sid.interact(elementId, action);
  
  if (result.success) {
    console.log('Selection successful');
  } else {
    console.error('Selection failed:', result.error);
  }
  
  return result;
}

/**
 * Check or uncheck a checkbox
 */
async function toggleCheckbox(
  sid: SIDAPI, 
  elementId: string, 
  checked: boolean
): Promise<InteractionResult> {
  console.log(`Setting ${elementId} to: ${checked}`);
  
  const action: InteractionAction = { type: 'check', value: checked };
  const result = await sid.interact(elementId, action);
  
  if (result.success) {
    console.log('Checkbox toggled successfully');
  } else {
    console.error('Toggle failed:', result.error);
  }
  
  return result;
}

/**
 * Hover over an element
 */
async function hoverElement(sid: SIDAPI, elementId: string): Promise<InteractionResult> {
  console.log(`Hovering over: ${elementId}`);
  
  const action: InteractionAction = { type: 'hover' };
  const result = await sid.interact(elementId, action);
  
  if (result.success) {
    console.log('Hover successful');
  } else {
    console.error('Hover failed:', result.error);
  }
  
  return result;
}

// ============================================================================
// Operation Tracking
// ============================================================================

/**
 * Execute a tracked interaction and poll for completion
 */
async function executeTrackedAction(
  sid: SIDAPI, 
  elementId: string
): Promise<Operation | null> {
  console.log(`Executing tracked action on: ${elementId}`);
  
  // Perform the interaction
  const result = await sid.interact(elementId, { type: 'click' });
  
  if (!result.success) {
    console.error('Interaction failed:', result.error);
    return null;
  }
  
  // Check if the action created an operation
  if (!result.operation) {
    console.log('Action completed (not tracked)');
    return null;
  }
  
  console.log(`Operation started: ${result.operation.id}`);
  console.log(`Tracking type: ${result.operation.tracking.type}`);
  
  // Poll for operation completion
  if (result.operation.tracking.type === 'poll') {
    try {
      const operation = await sid.pollOperation(
        result.operation.id,
        30000,  // 30 second timeout
        100     // Poll every 100ms
      );
      
      console.log(`Operation completed with status: ${operation.status}`);
      
      if (operation.effects) {
        console.log('Effects:', operation.effects);
      }
      
      return operation;
    } catch (error) {
      console.error('Operation timed out or failed:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Check the status of an operation
 */
function checkOperationStatus(sid: SIDAPI, operationId: string): void {
  const operation = sid.getOperation(operationId);
  
  if (operation) {
    console.log(`Operation ${operationId}:`);
    console.log(`  Status: ${operation.status}`);
    console.log(`  Started: ${new Date(operation.startedAt).toISOString()}`);
    
    if (operation.completedAt) {
      console.log(`  Completed: ${new Date(operation.completedAt).toISOString()}`);
    }
    
    if (operation.message) {
      console.log(`  Message: ${operation.message}`);
    }
  } else {
    console.log(`Operation not found: ${operationId}`);
  }
}

// ============================================================================
// Context Information
// ============================================================================

/**
 * Display page and app context
 */
function showContext(sid: SIDAPI): void {
  console.log('=== SID Context ===');
  console.log('App Context:', sid.getAppContext() || '(not set)');
  console.log('Page Context:', sid.getPageContext() || '(not set)');
  console.log('Version:', sid.version);
}

// ============================================================================
// Complete Example Flow
// ============================================================================

/**
 * Demonstrates a complete form-filling workflow
 */
async function completeFormExample(sid: SIDAPI): Promise<void> {
  console.log('\n=== Starting Form Fill Example ===\n');
  
  // 1. Show context
  showContext(sid);
  
  // 2. Discover elements
  console.log('\n--- Discovering Elements ---');
  discoverElements(sid);
  
  // 3. Fill form fields
  console.log('\n--- Filling Form ---');
  await fillInput(sid, 'name-input', 'John Doe');
  await fillInput(sid, 'email-input', 'john.doe@example.com');
  await selectOption(sid, 'subject-select', 'Technical Support');
  await fillInput(sid, 'message-input', 'I need help with the API integration.');
  await toggleCheckbox(sid, 'newsletter-checkbox', true);
  
  // 4. Submit form (tracked action)
  console.log('\n--- Submitting Form ---');
  const operation = await executeTrackedAction(sid, 'submit-button');
  
  if (operation) {
    console.log('\nForm submitted successfully!');
  }
  
  console.log('\n=== Example Complete ===');
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up the SID runtime
 */
function cleanup(): void {
  destroy();
  console.log('SID runtime destroyed');
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main function demonstrating SID runtime usage
 */
async function main(): Promise<void> {
  // Initialize the runtime
  const sid = basicInit();
  
  try {
    // Run the complete example
    await completeFormExample(sid);
  } finally {
    // Always clean up
    cleanup();
  }
}

// Export functions for use in other modules
export {
  basicInit,
  initWithAuth,
  discoverElements,
  getElementById,
  clickElement,
  fillInput,
  selectOption,
  toggleCheckbox,
  hoverElement,
  executeTrackedAction,
  checkOperationStatus,
  showContext,
  completeFormExample,
  cleanup,
  main,
};

// Run main if this is the entry point
// Uncomment the following line to run the example:
// main().catch(console.error);
