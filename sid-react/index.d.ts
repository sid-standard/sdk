/**
 * @sid-standard/react
 * 
 * React/JSX type augmentations for SID data-sid-* attributes.
 * This package augments React's HTMLAttributes interface to include
 * all SID-related data attributes with proper TypeScript types.
 * 
 * @packageDocumentation
 */

import "react";

declare module "react" {
  interface HTMLAttributes<T> {
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
