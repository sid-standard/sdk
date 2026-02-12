# @sid-standard/runtime

The official runtime library for the **SID (Semantic Interaction Description)** standard. This package implements the `window.SID` JavaScript API, enabling AI agents to discover and interact with your web application's UI elements.

## Features

- 🔍 **Automatic Element Discovery** - Discovers all `data-sid-*` annotated elements
- 🎯 **Programmatic Interactions** - Click, fill, select, check, hover, and upload actions
- 📊 **Operation Tracking** - Track async operations with polling support
- 🔐 **Authentication Support** - Optional agent authentication
- 📝 **Full TypeScript Support** - Includes type definitions
- 🌐 **Multiple Build Formats** - ESM, CommonJS, and UMD builds

## Installation

```bash
# npm
npm install @sid-standard/runtime

# yarn
yarn add @sid-standard/runtime

# pnpm
pnpm add @sid-standard/runtime
```

## Quick Start

```typescript
import { init } from '@sid-standard/runtime';

// Initialize the SID runtime
const sid = init();

// Now window.SID is available for AI agents
console.log(sid.isSupported()); // true

// Get all SID-annotated elements
const elements = sid.getElements();
console.log(`Found ${elements.length} interactive elements`);
```

## Usage

### ESM (ES Modules)

```typescript
import { init, destroy } from '@sid-standard/runtime';

// Initialize with default options
const sid = init();

// Or with custom options
const sid = init({
  observeDOM: true,  // Watch for DOM changes (default: true)
  auth: {
    description: 'Bearer token authentication',
    authenticate: async (token) => {
      // Validate the token
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.ok;
    }
  }
});

// Clean up when done
destroy();
```

### CommonJS

```javascript
const { init, destroy } = require('@sid-standard/runtime');

// Initialize the runtime
const sid = init();

// Use the API
const elements = sid.getElements();
elements.forEach(el => {
  console.log(`${el.id}: ${el.description}`);
});

// Clean up
destroy();
```

### UMD (Script Tag)

```html
<!-- Include the UMD build -->
<script src="https://unpkg.com/@sid-standard/runtime/dist/index.umd.js"></script>

<script>
  // Initialize using the global SIDRuntime object
  const sid = SIDRuntime.init();

  // Use the API
  console.log('SID supported:', sid.isSupported());
  console.log('Elements:', sid.getElements());

  // Clean up when done
  SIDRuntime.destroy();
</script>
```

## API Reference

### Initialization Functions

#### `init(options?)`

Initializes the SID runtime and exposes `window.SID`.

```typescript
function init(options?: SIDRuntimeOptions): SIDAPI;
```

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `observeDOM` | `boolean` | `true` | Enable MutationObserver for dynamic element discovery |
| `auth` | `object` | `undefined` | Authentication configuration |
| `auth.description` | `string` | - | Description of the authentication method |
| `auth.authenticate` | `(token: string) => Promise<boolean>` | - | Callback to authenticate a token |

**Returns:** The `SIDAPI` instance (also available as `window.SID`)

**Example:**

```typescript
const sid = init({
  observeDOM: true,
  auth: {
    description: 'API key authentication',
    authenticate: async (token) => {
      return token === process.env.VALID_API_KEY;
    }
  }
});
```

#### `destroy()`

Cleans up the SID runtime and removes `window.SID`.

```typescript
function destroy(): void;
```

**Example:**

```typescript
// Clean up resources
destroy();
console.log(window.SID); // undefined
```

---

### window.SID API Methods

Once initialized, the following methods are available on `window.SID`:

#### `isSupported()`

Checks if SID is supported on the current page.

```typescript
window.SID.isSupported(): boolean;
```

**Returns:** `true` when the SID runtime is loaded

---

#### `getElements()`

Gets all SID-annotated elements on the page.

```typescript
window.SID.getElements(): SIDElement[];
```

**Returns:** Array of `SIDElement` objects

**Example:**

```typescript
const elements = window.SID.getElements();
elements.forEach(el => {
  console.log(`ID: ${el.id}`);
  console.log(`Description: ${el.description}`);
  console.log(`Actions: ${el.actions.map(a => a.type).join(', ')}`);
});
```

---

#### `getElement(id)`

Gets a specific SID element by its ID.

```typescript
window.SID.getElement(id: string): SIDElement | null;
```

**Parameters:**
- `id` - The `data-sid` attribute value

**Returns:** The `SIDElement` or `null` if not found

**Example:**

```typescript
const submitBtn = window.SID.getElement('submit-button');
if (submitBtn) {
  console.log(submitBtn.description);
}
```

---

#### `interact(id, action)`

Performs an interaction on an element.

```typescript
window.SID.interact(id: string, action: InteractionAction): Promise<InteractionResult>;
```

**Parameters:**
- `id` - The `data-sid` attribute value
- `action` - The action to perform

**Action Types:**

| Type | Value | Description |
|------|-------|-------------|
| `click` | - | Clicks the element |
| `fill` | `string` | Fills an input with text |
| `select` | `string` | Selects an option in a dropdown |
| `check` | `boolean` | Checks/unchecks a checkbox or radio |
| `hover` | - | Hovers over the element |
| `upload` | `File` | Uploads a file to a file input |

**Returns:** `InteractionResult` with `success`, `error`, `message`, and optional `operation`

**Examples:**

```typescript
// Click a button
const result = await window.SID.interact('submit-btn', { type: 'click' });

// Fill an input field
const result = await window.SID.interact('email-input', { 
  type: 'fill', 
  value: 'user@example.com' 
});

// Select a dropdown option
const result = await window.SID.interact('country-select', { 
  type: 'select', 
  value: 'United States' 
});

// Check a checkbox
const result = await window.SID.interact('terms-checkbox', { 
  type: 'check', 
  value: true 
});

// Hover over an element
const result = await window.SID.interact('menu-item', { type: 'hover' });

// Handle the result
if (result.success) {
  console.log('Interaction successful:', result.message);
} else {
  console.error('Interaction failed:', result.error);
}
```

---

#### `getOperation(id)`

Gets a tracked operation by its ID.

```typescript
window.SID.getOperation(id: string): Operation | null;
```

**Parameters:**
- `id` - The operation ID

**Returns:** The `Operation` object or `null` if not found

**Example:**

```typescript
const operation = window.SID.getOperation('op-123');
if (operation) {
  console.log(`Status: ${operation.status}`);
  console.log(`Started: ${new Date(operation.startedAt)}`);
}
```

---

#### `pollOperation(id, timeoutMs?, intervalMs?)`

Polls an operation until it completes or times out.

```typescript
window.SID.pollOperation(
  id: string, 
  timeoutMs?: number, 
  intervalMs?: number
): Promise<Operation>;
```

**Parameters:**
- `id` - The operation ID
- `timeoutMs` - Maximum wait time (default: 30000ms)
- `intervalMs` - Poll interval (default: 100ms)

**Returns:** Promise resolving to the completed `Operation`

**Throws:** `OperationTimeoutError` if timeout is reached

**Example:**

```typescript
// After a tracked interaction
const result = await window.SID.interact('submit-form', { type: 'click' });

if (result.operation) {
  try {
    // Wait for the operation to complete
    const operation = await window.SID.pollOperation(
      result.operation.id,
      10000,  // 10 second timeout
      200     // Check every 200ms
    );
    
    if (operation.status === 'success') {
      console.log('Form submitted successfully');
      if (operation.effects?.navigatedTo) {
        console.log(`Redirected to: ${operation.effects.navigatedTo}`);
      }
    } else {
      console.error('Submission failed:', operation.message);
    }
  } catch (error) {
    console.error('Operation timed out');
  }
}
```

---

#### `getPageContext()`

Gets the page context description.

```typescript
window.SID.getPageContext(): string;
```

**Returns:** The page context string from `<script type="application/sid+json">`

---

#### `getAppContext()`

Gets the application context description.

```typescript
window.SID.getAppContext(): string;
```

**Returns:** The app context string from `<script type="application/sid+json">`

**Example:**

```typescript
console.log('App:', window.SID.getAppContext());
// "E-commerce platform for electronics"

console.log('Page:', window.SID.getPageContext());
// "Product listing page showing laptops"
```

---

### Properties

#### `version`

The SID specification version.

```typescript
window.SID.version: string; // "1.0.0"
```

#### `auth` (optional)

Authentication support when configured during initialization.

```typescript
window.SID.auth?: {
  description: string;
  authenticate(token: string): Promise<boolean>;
};
```

**Example:**

```typescript
if (window.SID.auth) {
  const isValid = await window.SID.auth.authenticate('my-api-token');
  console.log('Authentication:', isValid ? 'success' : 'failed');
}
```

## Configuration Options

### `observeDOM`

When `true` (default), the runtime uses a `MutationObserver` to automatically detect when SID-annotated elements are added or removed from the DOM. This is useful for single-page applications where content changes dynamically.

```typescript
// Disable DOM observation for static pages
const sid = init({ observeDOM: false });
```

### `auth`

Configure authentication support for AI agents to authenticate with your application.

```typescript
const sid = init({
  auth: {
    description: 'OAuth 2.0 Bearer token - obtain from /api/auth/token',
    authenticate: async (token) => {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    }
  }
});
```

## TypeScript Support

This package includes TypeScript type definitions out of the box. All types are exported from the main entry point:

```typescript
import { 
  init, 
  destroy,
  // Types
  type SIDAPI,
  type SIDElement,
  type ActionDefinition,
  type InteractionAction,
  type InteractionResult,
  type Operation,
  type OperationTracking,
  type OperationEffects,
  type HumanInputRequirement,
  type SIDAuth,
  type SIDActionType,
  type SIDTrackingType,
  type SIDOperationStatus,
} from '@sid-standard/runtime';

// Full type safety
const sid: SIDAPI = init();
const elements: SIDElement[] = sid.getElements();
```

## JavaScript Support

For JavaScript projects, the library includes comprehensive JSDoc comments that provide IntelliSense and autocomplete in modern IDEs like VS Code:

```javascript
// @ts-check (optional - enables type checking in JS files)

const { init, destroy } = require('@sid-standard/runtime');

// IDE will show parameter hints and return types
const sid = init({
  observeDOM: true
});

// Autocomplete works for all methods
const elements = sid.getElements();
```

## Related Packages

| Package | Description |
|---------|-------------|
| [@sid-standard/types](../sid-types) | TypeScript type definitions for the SID API and HTML attributes |
| [@sid-standard/react](../sid-react) | React/JSX type augmentations for `data-sid-*` attributes |

## Browser Support

The runtime supports all modern browsers:

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+

## License

MIT
