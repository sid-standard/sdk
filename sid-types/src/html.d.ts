/**
 * HTML Attributes augmentation for SID data attributes
 * 
 * This module augments the global HTMLAttributes interface to include
 * all data-sid-* attributes with proper TypeScript types.
 * This enables type checking and autocomplete for SID attributes in HTML/JSX.
 */

declare module "*.html" {}

declare global {
  interface HTMLAttributes {
    /** Unique SID element identifier */
    "data-sid"?: string;
    /** Short description of the element */
    "data-sid-desc"?: string;
    /** Detailed description of the element */
    "data-sid-desc-long"?: string;
    /** Interaction type */
    "data-sid-action"?: "click" | "fill" | "select" | "check" | "hover" | "upload";
    /** Input metadata: dataType,required|optional */
    "data-sid-input"?: string;
    /** Comma-separated options for select elements */
    "data-sid-options"?: string;
    /** Operation tracking type */
    "data-sid-tracking"?: "async" | "navigation" | "external" | "none";
    /** Destination URL for navigation tracking */
    "data-sid-destination"?: string;
    /** JSON human input requirement */
    "data-sid-human-input"?: string;
    /** Whether element is disabled */
    "data-sid-disabled"?: "true" | "false";
    /** Why element is disabled */
    "data-sid-disabled-desc"?: string;
  }
}

export {};
