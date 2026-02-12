# @sid-standard/types

TypeScript type definitions for the **SID (Semantic Interaction Description)** standard. This package provides comprehensive type definitions for building AI-agent-friendly web applications.

## Overview

SID is a standard for making web applications accessible to AI agents. This package provides TypeScript types for:

- **Core API types** - Interfaces for elements, actions, operations, and the global `window.SID` API
- **Window augmentation** - Adds the `SID` property to the global `Window` interface
- **HTML attribute augmentation** - Adds `data-sid-*` attributes to `HTMLAttributes` for type-safe HTML/JSX

## Installation

```bash
npm install @sid-standard/types
```

Or with yarn:

```bash
yarn add @sid-standard/types
```

Or with pnpm:

```bash
pnpm add @sid-standard/types
```

## Usage

### Importing Types

Import the types you need directly from the package:

```typescript
import type {
  SIDElement,
  ActionDefinition,
  InteractionAction,
  InteractionResult,
  Operation,
  SIDAPI,
} from '@sid-standard/types';
```

### Using the Window.SID API

The package automatically augments the global `Window` interface with the optional `SID` property:

```typescript
// Check if SID is available
if (window.SID?.isSupported()) {
  // Get all interactive elements
  const elements = window.SID.getElements();
  
  // Get a specific element
  const button = window.SID.getElement('submit-btn');
  
  // Interact with an element
  const result = await window.SID.interact('email-input', {
    type: 'fill',
    value: 'user@example.com'
  });
}
```

### Using HTML data-sid-* Attributes

The package augments `HTMLAttributes` to include all SID data attributes with proper types:

```typescript
// TypeScript will recognize these attributes
const element = document.createElement('button');
element.setAttribute('data-sid', 'submit-btn');
element.setAttribute('data-sid-desc', 'Submit the form');
element.setAttribute('data-sid-action', 'click'); // Autocomplete: "click" | "fill" | "select" | "check" | "hover" | "upload"
element.setAttribute('data-sid-tracking', 'async'); // Autocomplete: "async" | "navigation" | "external" | "none"
```

## Exported Types

### Type Aliases

| Type | Description |
|------|-------------|
| `SIDActionType` | Action types: `"click"` \| `"fill"` \| `"select"` \| `"check"` \| `"hover"` \| `"upload"` |
| `SIDInputDataType` | Input data types: `"text"` \| `"number"` \| `"date"` \| `"email"` \| `"password"` \| `"file"` |
| `SIDTrackingType` | Tracking types: `"async"` \| `"navigation"` \| `"external"` \| `"none"` |
| `SIDOperationStatus` | Operation status: `"pending"` \| `"success"` \| `"error"` |
| `OperationTracking` | Union type for tracking configuration |

### Interfaces

| Interface | Description |
|-----------|-------------|
| `SIDElement` | Represents an interactive element with SID metadata |
| `ActionDefinition` | Defines an action that can be performed on an element |
| `InputDefinition` | Input configuration for actions requiring values |
| `ElementState` | Current state of an element (visible, enabled, value) |
| `InteractionAction` | Action to perform on an element |
| `InteractionResult` | Result of an interaction attempt |
| `OperationHandle` | Handle to a tracked operation |
| `Operation` | A tracked async operation |
| `OperationEffects` | Effects produced by a completed operation |
| `HumanInputRequirement` | Requirement for human input on sensitive data |
| `JSONSchema` | JSON Schema type for input validation |
| `UIHints` | UI hints for human input forms |
| `SIDAuth` | Authentication configuration |
| `SIDAPI` | The global SID API interface |

## Global Augmentations

### Window Interface

The package augments the global `Window` interface:

```typescript
interface Window {
  SID?: SIDAPI;
}
```

This allows you to access `window.SID` with full type safety:

```typescript
// TypeScript knows window.SID is SIDAPI | undefined
const api = window.SID;

// Safe access with optional chaining
const elements = window.SID?.getElements() ?? [];
```

### HTMLAttributes Interface

The package augments the global `HTMLAttributes` interface with all `data-sid-*` attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-sid` | `string` | Unique SID element identifier |
| `data-sid-desc` | `string` | Short description of the element |
| `data-sid-desc-long` | `string` | Detailed description of the element |
| `data-sid-action` | `"click"` \| `"fill"` \| `"select"` \| `"check"` \| `"hover"` \| `"upload"` | Interaction type |
| `data-sid-input` | `string` | Input metadata (format: `dataType,required\|optional`) |
| `data-sid-options` | `string` | Comma-separated options for select elements |
| `data-sid-tracking` | `"async"` \| `"navigation"` \| `"external"` \| `"none"` | Operation tracking type |
| `data-sid-destination` | `string` | Destination URL for navigation tracking |
| `data-sid-human-input` | `string` | JSON human input requirement |
| `data-sid-disabled` | `"true"` \| `"false"` | Whether element is disabled |
| `data-sid-disabled-desc` | `string` | Why element is disabled |

## Examples

### Defining a SID Element

```typescript
import type { SIDElement, ActionDefinition } from '@sid-standard/types';

const submitButton: SIDElement = {
  id: 'submit-btn',
  selector: '[data-sid="submit-btn"]',
  description: 'Submit the contact form',
  actions: [
    {
      type: 'click',
      tracked: true,
      description: 'Submits the form and sends the message'
    }
  ],
  disabled: false
};
```

### Handling Interaction Results

```typescript
import type { InteractionResult, Operation } from '@sid-standard/types';

async function submitForm(): Promise<void> {
  // interact() now waits for completion internally
  const result: InteractionResult = await window.SID!.interact('submit-btn', {
    type: 'click'
  }, { timeout: 30000 });

  if (result.status === 'completed') {
    console.log('Form submitted successfully!');
  } else if (result.status === 'error') {
    console.error('Form submission failed:', result.error);
  }
}
```

### Working with Human Input Requirements

```typescript
import type { HumanInputRequirement } from '@sid-standard/types';

const paymentInput: HumanInputRequirement = {
  reason: 'Payment information requires human verification',
  schema: {
    type: 'object',
    properties: {
      cardNumber: {
        type: 'string',
        title: 'Card Number',
        'x-sid-sensitive': true
      },
      cvv: {
        type: 'string',
        title: 'CVV',
        'x-sid-sensitive': true
      }
    },
    required: ['cardNumber', 'cvv']
  },
  uiHints: {
    title: 'Enter Payment Details',
    sections: [
      { title: 'Card Information', fields: ['cardNumber', 'cvv'] }
    ]
  }
};
```

## Related Packages

- **[@sid-standard/runtime](https://www.npmjs.com/package/@sid-standard/runtime)** - The JavaScript runtime that implements `window.SID`
- **[@sid-standard/react](https://www.npmjs.com/package/@sid-standard/react)** - React/JSX-specific type augmentations for `data-sid-*` attributes

## License

MIT
