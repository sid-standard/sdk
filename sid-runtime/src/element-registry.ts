/**
 * @module element-registry
 * 
 * Manages the discovery and tracking of SID-annotated DOM elements.
 * This module provides the ElementRegistry class which scans the document
 * for elements with data-sid attributes and maintains a registry of them.
 * It also observes DOM mutations to keep the registry in sync with the page.
 * 
 * @packageDocumentation
 */

import type {
  SIDElement,
  ActionDefinition,
  SIDTrackingType,
} from '@sid-standard/types';

import { parseAttributes, ParsedAttributes } from './attribute-parser';

/**
 * Generates a CSS selector for an element based on its data-sid attribute.
 * 
 * @param id - The data-sid attribute value
 * @returns A CSS selector string that uniquely identifies the element
 * @internal
 */
function generateSelector(id: string): string {
  // Escape special characters in the ID for use in CSS selector
  const escapedId = CSS.escape(id);
  return `[data-sid="${escapedId}"]`;
}

/**
 * Converts a tracking type string to a boolean indicating if the action is tracked.
 * 
 * @param tracking - The tracking type from parsed attributes
 * @returns True if the action produces a trackable operation
 * @internal
 */
function isTracked(tracking: SIDTrackingType): boolean {
  return tracking !== 'none';
}

/**
 * Converts ParsedAttributes to an ActionDefinition.
 * 
 * @param attrs - The parsed attributes from an element
 * @returns An ActionDefinition object
 * @internal
 */
function createActionDefinition(attrs: ParsedAttributes): ActionDefinition {
  return {
    type: attrs.action,
    input: attrs.input,
    tracked: isTracked(attrs.tracking),
    description: attrs.description,
  };
}

/**
 * Converts ParsedAttributes to a SIDElement.
 * 
 * @param attrs - The parsed attributes from an element
 * @returns A SIDElement object
 * @internal
 */
function convertToSIDElement(attrs: ParsedAttributes): SIDElement {
  return {
    id: attrs.id,
    selector: generateSelector(attrs.id),
    description: attrs.description,
    descriptionLong: attrs.descriptionLong,
    actions: [createActionDefinition(attrs)],
    disabled: attrs.disabled,
    disabledDescription: attrs.disabledDescription,
    humanInput: attrs.humanInput,
  };
}

/**
 * Registry for managing SID-annotated DOM elements.
 * 
 * The ElementRegistry class provides functionality to:
 * - Scan the document for elements with data-sid attributes
 * - Parse element attributes into structured SIDElement objects
 * - Maintain a Map-based registry of all discovered elements
 * - Observe DOM mutations to keep the registry synchronized
 * 
 * @example
 * ```typescript
 * // Create a registry with DOM observation enabled
 * const registry = new ElementRegistry(true);
 * 
 * // Get all registered elements
 * const elements = registry.getAll();
 * 
 * // Get a specific element by ID
 * const element = registry.get('submit-button');
 * 
 * // Clean up when done
 * registry.destroy();
 * ```
 */
export class ElementRegistry {
  /**
   * Map storing SIDElement objects keyed by their ID
   * @internal
   */
  private elements: Map<string, SIDElement> = new Map();

  /**
   * MutationObserver instance for watching DOM changes
   * @internal
   */
  private observer: MutationObserver | null = null;

  /**
   * Creates a new ElementRegistry instance.
   * 
   * @param observeDOM - Whether to enable MutationObserver for dynamic element discovery
   * 
   * @example
   * ```typescript
   * // With DOM observation (recommended for dynamic pages)
   * const registry = new ElementRegistry(true);
   * 
   * // Without DOM observation (for static pages)
   * const registry = new ElementRegistry(false);
   * ```
   */
  constructor(observeDOM: boolean = true) {
    this.scanDocument();
    if (observeDOM) {
      this.startObserving();
    }
  }

  /**
   * Scans the entire document for elements with data-sid attributes
   * and adds them to the registry.
   * 
   * This method clears the existing registry and performs a fresh scan.
   * It's called automatically during construction and can be called
   * manually to rescan the document.
   * 
   * @example
   * ```typescript
   * const registry = new ElementRegistry(false);
   * 
   * // Later, after DOM changes
   * registry.scanDocument();
   * ```
   */
  scanDocument(): void {
    // Clear existing elements
    this.elements.clear();

    // Find all elements with data-sid attribute
    const sidElements = document.querySelectorAll<HTMLElement>('[data-sid]');

    // Parse and register each element
    sidElements.forEach((el) => {
      const sidElement = this.parseElement(el);
      if (sidElement) {
        this.elements.set(sidElement.id, sidElement);
      }
    });
  }

  /**
   * Parses a single DOM element into a SIDElement object.
   * 
   * This method extracts all data-sid-* attributes from the element
   * and converts them into a structured SIDElement object.
   * 
   * @param el - The HTML element to parse
   * @returns The parsed SIDElement, or null if the element doesn't have a data-sid attribute
   * 
   * @example
   * ```typescript
   * const button = document.querySelector('#my-button');
   * const sidElement = registry.parseElement(button);
   * 
   * if (sidElement) {
   *   console.log(sidElement.id, sidElement.description);
   * }
   * ```
   */
  parseElement(el: HTMLElement): SIDElement | null {
    const attrs = parseAttributes(el);
    
    if (!attrs) {
      return null;
    }

    return convertToSIDElement(attrs);
  }

  /**
   * Returns all registered SIDElement objects.
   * 
   * @returns An array of all SIDElement objects in the registry
   * 
   * @example
   * ```typescript
   * const elements = registry.getAll();
   * elements.forEach(el => {
   *   console.log(`${el.id}: ${el.description}`);
   * });
   * ```
   */
  getAll(): SIDElement[] {
    return Array.from(this.elements.values());
  }

  /**
   * Retrieves a specific SIDElement by its ID.
   * 
   * @param id - The data-sid attribute value to look up
   * @returns The SIDElement with the given ID, or null if not found
   * 
   * @example
   * ```typescript
   * const element = registry.get('submit-button');
   * 
   * if (element) {
   *   console.log(`Found: ${element.description}`);
   * } else {
   *   console.log('Element not found');
   * }
   * ```
   */
  get(id: string): SIDElement | null {
    return this.elements.get(id) ?? null;
  }

  /**
   * Starts observing the DOM for mutations that affect SID elements.
   * 
   * The observer watches for:
   * - Added nodes with data-sid attributes
   * - Removed nodes with data-sid attributes
   * - Attribute changes on elements with data-sid attributes
   * 
   * This method is called automatically during construction if
   * observeDOM is true.
   * 
   * @example
   * ```typescript
   * const registry = new ElementRegistry(false);
   * 
   * // Later, enable observation
   * registry.startObserving();
   * ```
   */
  startObserving(): void {
    // Don't create multiple observers
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Observe the entire document for changes
    this.observer.observe(document.body, {
      childList: true,      // Watch for added/removed nodes
      subtree: true,        // Watch all descendants
      attributes: true,     // Watch for attribute changes
      attributeFilter: [    // Only watch SID-related attributes
        'data-sid',
        'data-sid-desc',
        'data-sid-desc-long',
        'data-sid-action',
        'data-sid-input',
        'data-sid-options',
        'data-sid-tracking',
        'data-sid-destination',
        'data-sid-human-input',
        'data-sid-disabled',
        'data-sid-disabled-desc',
      ],
    });
  }

  /**
   * Handles DOM mutations and updates the registry accordingly.
   * 
   * @param mutations - Array of MutationRecord objects from the observer
   * @internal
   */
  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Handle added nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.handleAddedNode(node);
          }
        });

        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.handleRemovedNode(node);
          }
        });
      } else if (mutation.type === 'attributes') {
        // Handle attribute changes
        if (mutation.target instanceof HTMLElement) {
          this.handleAttributeChange(mutation.target, mutation.attributeName);
        }
      }
    }
  }

  /**
   * Handles a node being added to the DOM.
   * 
   * @param node - The added HTML element
   * @internal
   */
  private handleAddedNode(node: HTMLElement): void {
    // Check if the node itself has data-sid
    if (node.hasAttribute('data-sid')) {
      const sidElement = this.parseElement(node);
      if (sidElement) {
        this.elements.set(sidElement.id, sidElement);
      }
    }

    // Check descendants for data-sid elements
    const descendants = node.querySelectorAll<HTMLElement>('[data-sid]');
    descendants.forEach((el) => {
      const sidElement = this.parseElement(el);
      if (sidElement) {
        this.elements.set(sidElement.id, sidElement);
      }
    });
  }

  /**
   * Handles a node being removed from the DOM.
   * 
   * @param node - The removed HTML element
   * @internal
   */
  private handleRemovedNode(node: HTMLElement): void {
    // Check if the node itself has data-sid
    const id = node.getAttribute('data-sid');
    if (id) {
      this.elements.delete(id);
    }

    // Check descendants for data-sid elements
    const descendants = node.querySelectorAll<HTMLElement>('[data-sid]');
    descendants.forEach((el) => {
      const descendantId = el.getAttribute('data-sid');
      if (descendantId) {
        this.elements.delete(descendantId);
      }
    });
  }

  /**
   * Handles an attribute change on an element.
   * 
   * @param element - The element whose attribute changed
   * @param attributeName - The name of the changed attribute
   * @internal
   */
  private handleAttributeChange(element: HTMLElement, attributeName: string | null): void {
    if (!attributeName) {
      return;
    }

    // If data-sid was added or changed
    if (attributeName === 'data-sid') {
      const newId = element.getAttribute('data-sid');
      
      if (newId) {
        // Element now has data-sid, parse and add it
        const sidElement = this.parseElement(element);
        if (sidElement) {
          this.elements.set(sidElement.id, sidElement);
        }
      } else {
        // data-sid was removed, we need to find and remove the old entry
        // Since we don't have the old ID, we need to search for it
        // This is a rare case, so linear search is acceptable
        for (const [id, sidEl] of this.elements) {
          const domEl = document.querySelector(sidEl.selector);
          if (domEl === element) {
            this.elements.delete(id);
            break;
          }
        }
      }
    } else {
      // Another SID attribute changed, re-parse the element
      const id = element.getAttribute('data-sid');
      if (id && this.elements.has(id)) {
        const sidElement = this.parseElement(element);
        if (sidElement) {
          this.elements.set(sidElement.id, sidElement);
        }
      }
    }
  }

  /**
   * Stops observing DOM mutations and cleans up resources.
   * 
   * This method should be called when the registry is no longer needed
   * to prevent memory leaks and unnecessary processing.
   * 
   * @example
   * ```typescript
   * const registry = new ElementRegistry(true);
   * 
   * // ... use the registry ...
   * 
   * // Clean up when done
   * registry.destroy();
   * ```
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.elements.clear();
  }
}
