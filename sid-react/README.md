# @sid-standard/react

React/JSX type augmentations for the **SID (Semantic Interaction Description)** standard. This package provides TypeScript support for `data-sid-*` attributes in React components.

## Overview

When building React applications with SID support, you need TypeScript to recognize the `data-sid-*` attributes in your JSX. This package augments React's `HTMLAttributes` interface to include all SID attributes with proper types and autocomplete support.

## Installation

```bash
# npm
npm install @sid-standard/react @sid-standard/runtime

# yarn
yarn add @sid-standard/react @sid-standard/runtime

# pnpm
pnpm add @sid-standard/react @sid-standard/runtime
```

## Usage

Simply import the package in your application entry point or a global types file:

```typescript
// In your app's entry point (e.g., main.tsx, App.tsx)
import '@sid-standard/react';
import { init } from '@sid-standard/runtime';

// Initialize the SID runtime
init();
```

Or add it to a global types file:

```typescript
// types/global.d.ts
import '@sid-standard/react';
```

## React Component Examples

Once imported, you can use `data-sid-*` attributes in your JSX without TypeScript errors:

### Button with Click Action

```tsx
function SubmitButton() {
  return (
    <button
      data-sid="submit-form"
      data-sid-desc="Submit the contact form"
      data-sid-action="click"
      data-sid-tracking="async"
      onClick={handleSubmit}
    >
      Submit
    </button>
  );
}
```

### Input with Fill Action

```tsx
function EmailInput() {
  return (
    <input
      type="email"
      data-sid="email-input"
      data-sid-desc="Email address for account registration"
      data-sid-action="fill"
      data-sid-input="email,required"
      placeholder="Enter your email"
    />
  );
}
```

### Select with Options

```tsx
function CountrySelect() {
  return (
    <select
      data-sid="country-select"
      data-sid-desc="Select your country"
      data-sid-action="select"
      data-sid-options="United States,Canada,United Kingdom,Australia"
    >
      <option value="US">United States</option>
      <option value="CA">Canada</option>
      <option value="UK">United Kingdom</option>
      <option value="AU">Australia</option>
    </select>
  );
}
```

### Checkbox with Check Action

```tsx
function TermsCheckbox() {
  return (
    <label>
      <input
        type="checkbox"
        data-sid="terms-checkbox"
        data-sid-desc="Accept terms and conditions"
        data-sid-action="check"
      />
      I accept the terms and conditions
    </label>
  );
}
```

### Disabled Element

```tsx
function DisabledButton() {
  return (
    <button
      data-sid="premium-feature"
      data-sid-desc="Access premium features"
      data-sid-action="click"
      data-sid-disabled="true"
      data-sid-disabled-desc="Requires premium subscription"
      disabled
    >
      Premium Feature
    </button>
  );
}
```

### Navigation Link

```tsx
function DashboardLink() {
  return (
    <a
      href="/dashboard"
      data-sid="dashboard-link"
      data-sid-desc="Navigate to user dashboard"
      data-sid-action="click"
      data-sid-tracking="navigation"
      data-sid-destination="/dashboard"
    >
      Go to Dashboard
    </a>
  );
}
```

## Available Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-sid` | `string` | Unique element identifier |
| `data-sid-desc` | `string` | Short description |
| `data-sid-desc-long` | `string` | Detailed description |
| `data-sid-action` | `"click"` \| `"fill"` \| `"select"` \| `"check"` \| `"hover"` \| `"upload"` | Interaction type |
| `data-sid-input` | `string` | Input metadata (format: `dataType,required\|optional`) |
| `data-sid-options` | `string` | Comma-separated options for select |
| `data-sid-tracking` | `"async"` \| `"navigation"` \| `"external"` \| `"none"` | Operation tracking type |
| `data-sid-destination` | `string` | Destination URL for navigation |
| `data-sid-human-input` | `string` | JSON human input requirement |
| `data-sid-disabled` | `"true"` \| `"false"` | Whether element is disabled |
| `data-sid-disabled-desc` | `string` | Why element is disabled |

## IDE Support

With this package installed, your IDE will provide:

- ✅ **Autocomplete** for attribute names (`data-sid-*`)
- ✅ **Autocomplete** for attribute values (`data-sid-action`, `data-sid-tracking`)
- ✅ **Type checking** for attribute values
- ✅ **No TypeScript errors** for SID attributes in JSX

## Related Packages

| Package | Description |
|---------|-------------|
| [@sid-standard/runtime](../sid-runtime) | Runtime library implementing `window.SID` |
| [@sid-standard/types](../sid-types) | Core TypeScript type definitions |

## License

MIT
