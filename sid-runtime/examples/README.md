# SID Runtime Examples

This directory contains example files demonstrating how to use the `@sid-standard/runtime` package in different environments.

## Examples

### 1. UMD Example (`umd-example.html`)

Demonstrates using the SID runtime via a script tag in a plain HTML file.

**Features demonstrated:**
- Including the UMD build via `<script>` tag
- SID context metadata via `<script type="application/sid+json">`
- Various `data-sid-*` attributes on form elements
- Initializing with `SIDRuntime.init()`
- Element discovery with `getElements()`
- Programmatic interactions with `interact()`

**How to run:**
```bash
# From the sid-runtime directory
npx serve .

# Then open http://localhost:3000/examples/umd-example.html
```

Or simply open the HTML file directly in a browser (note: some features may require a local server).

---

### 2. ESM Example (`esm-example.ts`)

Demonstrates using the SID runtime with ES Modules in a TypeScript project.

**Features demonstrated:**
- Importing from `@sid-standard/runtime`
- Type-safe API usage with TypeScript
- Initialization with and without authentication
- Element discovery and lookup
- All interaction types (click, fill, select, check, hover)
- Operation tracking and polling
- Context information retrieval
- Cleanup with `destroy()`

**How to use:**

```typescript
// Import in your TypeScript project
import { init, destroy } from '@sid-standard/runtime';

// Or import specific functions from the example
import { 
  basicInit, 
  discoverElements, 
  fillInput,
  completeFormExample 
} from './esm-example';
```

**To run the example:**
```bash
# Install dependencies
npm install

# Compile and run (requires ts-node or similar)
npx ts-node examples/esm-example.ts
```

---

### 3. React Example (`react-example.tsx`)

Demonstrates using the SID runtime with React components and JSX.

**Features demonstrated:**
- React context provider for SID runtime
- Custom `useSID()` hook
- `data-sid-*` attributes in JSX (with TypeScript support via `@sid-standard/react`)
- Form components with various action types:
  - Text inputs (`fill` action)
  - Select dropdowns (`select` action)
  - Checkboxes and radio buttons (`check` action)
  - File uploads (`upload` action)
- Navigation with `hover` and `click` actions
- Operation tracking with `async` tracking type
- Human input requirements for sensitive data
- Debug panel showing discovered elements

**Prerequisites:**
```bash
npm install @sid-standard/runtime @sid-standard/react react react-dom
```

**How to use:**

```tsx
// Import the components
import { App, SIDProvider, ContactForm } from './react-example';

// Use in your React application
function MyApp() {
  return (
    <SIDProvider>
      <ContactForm />
    </SIDProvider>
  );
}
```

---

## SID Attributes Reference

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-sid` | Unique element identifier | `data-sid="submit-button"` |
| `data-sid-desc` | Short description | `data-sid-desc="Submit the form"` |
| `data-sid-desc-long` | Detailed description | `data-sid-desc-long="Submits the form and sends an email"` |
| `data-sid-action` | Interaction type | `data-sid-action="click"` |
| `data-sid-input` | Input metadata | `data-sid-input="email,required"` |
| `data-sid-options` | Select options | `data-sid-options="Option 1,Option 2"` |
| `data-sid-tracking` | Operation tracking | `data-sid-tracking="async"` |
| `data-sid-destination` | Navigation destination | `data-sid-destination="/dashboard"` |
| `data-sid-disabled` | Disabled state | `data-sid-disabled="true"` |
| `data-sid-disabled-desc` | Why disabled | `data-sid-disabled-desc="Login required"` |
| `data-sid-human-input` | Human input requirement (JSON) | See React example |

## Action Types

| Action | Description | Value Type |
|--------|-------------|------------|
| `click` | Click the element | None |
| `fill` | Fill input with text | `string` |
| `select` | Select dropdown option | `string` |
| `check` | Check/uncheck checkbox | `boolean` |
| `hover` | Hover over element | None |
| `upload` | Upload file | `File` |

## Tracking Types

| Type | Description |
|------|-------------|
| `async` | `interact()` waits for `SID.complete()` to be called |
| `navigation` | Page navigation will occur |
| `external` | External system handles completion |
| `none` | No tracking needed (instant actions) |

## Related Packages

- [`@sid-standard/types`](../../sid-types) - TypeScript type definitions
- [`@sid-standard/react`](../../sid-react) - React/JSX type augmentations
