/**
 * @module attribute-parser
 * 
 * Parses data-sid-* attributes from DOM elements into structured objects.
 * This module handles the extraction and validation of all SID-related
 * HTML attributes, converting them into typed JavaScript objects.
 * 
 * @packageDocumentation
 */

import type {
  SIDActionType,
  SIDInputDataType,
  SIDTrackingType,
  InputDefinition,
  HumanInputRequirement,
} from '@sid-standard/types';

/**
 * Represents all parsed data-sid-* attributes from a DOM element.
 * This interface contains the structured data extracted from HTML attributes.
 */
export interface ParsedAttributes {
  /** Unique identifier from data-sid attribute */
  id: string;
  /** Short description from data-sid-desc */
  description: string;
  /** Detailed description from data-sid-desc-long */
  descriptionLong?: string;
  /** Action type from data-sid-action */
  action: SIDActionType;
  /** Input configuration parsed from data-sid-input */
  input?: InputDefinition;
  /** Options array parsed from data-sid-options */
  options?: string[];
  /** Tracking type from data-sid-tracking */
  tracking: SIDTrackingType;
  /** Destination URL from data-sid-destination */
  destination?: string;
  /** Human input requirement parsed from data-sid-human-input JSON */
  humanInput?: HumanInputRequirement;
  /** Whether element is disabled from data-sid-disabled */
  disabled: boolean;
  /** Explanation of why element is disabled from data-sid-disabled-desc */
  disabledDescription?: string;
}

/**
 * Valid action types for data-sid-action attribute
 * @internal
 */
const VALID_ACTION_TYPES: readonly SIDActionType[] = [
  'click',
  'fill',
  'select',
  'check',
  'hover',
  'upload',
] as const;

/**
 * Valid input data types for data-sid-input attribute
 * @internal
 */
const VALID_INPUT_DATA_TYPES: readonly SIDInputDataType[] = [
  'text',
  'number',
  'date',
  'email',
  'password',
  'file',
] as const;

/**
 * Valid tracking types for data-sid-tracking attribute
 * @internal
 */
const VALID_TRACKING_TYPES: readonly SIDTrackingType[] = [
  'async',
  'navigation',
  'external',
  'none',
] as const;

/**
 * Checks if a value is a valid SID action type.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid action type
 * @internal
 */
function isValidActionType(value: string): value is SIDActionType {
  return VALID_ACTION_TYPES.includes(value as SIDActionType);
}

/**
 * Checks if a value is a valid SID input data type.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid input data type
 * @internal
 */
function isValidInputDataType(value: string): value is SIDInputDataType {
  return VALID_INPUT_DATA_TYPES.includes(value as SIDInputDataType);
}

/**
 * Checks if a value is a valid SID tracking type.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid tracking type
 * @internal
 */
function isValidTrackingType(value: string): value is SIDTrackingType {
  return VALID_TRACKING_TYPES.includes(value as SIDTrackingType);
}

/**
 * Parses the data-sid-input attribute value into an InputDefinition object.
 * 
 * The expected format is: "dataType,required|optional"
 * 
 * @param value - The data-sid-input attribute value
 * @returns The parsed InputDefinition or null if the format is invalid
 * 
 * @example
 * ```typescript
 * // Valid inputs
 * parseInputAttribute('text,required');    // { dataType: 'text', required: true }
 * parseInputAttribute('email,optional');   // { dataType: 'email', required: false }
 * parseInputAttribute('number,required');  // { dataType: 'number', required: true }
 * 
 * // Invalid inputs (returns null)
 * parseInputAttribute('invalid');          // null
 * parseInputAttribute('text');             // null
 * parseInputAttribute('unknown,required'); // null
 * ```
 */
export function parseInputAttribute(value: string): InputDefinition | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  const parts = trimmedValue.split(',');

  // Must have exactly 2 parts: dataType and required/optional
  if (parts.length !== 2) {
    return null;
  }

  const [dataTypePart, requiredPart] = parts.map(p => p.trim().toLowerCase());

  // Validate data type
  if (!isValidInputDataType(dataTypePart)) {
    return null;
  }

  // Validate required/optional
  if (requiredPart !== 'required' && requiredPart !== 'optional') {
    return null;
  }

  return {
    dataType: dataTypePart,
    required: requiredPart === 'required',
  };
}

/**
 * Parses the data-sid-human-input attribute value from JSON into a HumanInputRequirement object.
 * 
 * The attribute value should be a valid JSON string conforming to the HumanInputRequirement schema.
 * 
 * @param value - The data-sid-human-input attribute value (JSON string)
 * @returns The parsed HumanInputRequirement or null if the JSON is invalid
 * 
 * @example
 * ```typescript
 * // Valid JSON
 * const json = '{"reason":"Payment requires card details","schema":{"type":"object"}}';
 * parseHumanInputAttribute(json);
 * // Returns: { reason: 'Payment requires card details', schema: { type: 'object' } }
 * 
 * // Invalid JSON (returns null)
 * parseHumanInputAttribute('not valid json');  // null
 * parseHumanInputAttribute('');                // null
 * ```
 */
export function parseHumanInputAttribute(value: string): HumanInputRequirement | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedValue);
    
    // Basic validation: must have reason and schema properties
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.reason !== 'string' ||
      typeof parsed.schema !== 'object' ||
      parsed.schema === null
    ) {
      return null;
    }

    return parsed as HumanInputRequirement;
  } catch {
    // JSON parsing failed
    return null;
  }
}

/**
 * Parses the data-sid-options attribute value into an array of option strings.
 * 
 * The expected format is a comma-separated list of options.
 * 
 * @param value - The data-sid-options attribute value
 * @returns An array of option strings, or undefined if no valid options
 * 
 * @example
 * ```typescript
 * parseOptionsAttribute('red,green,blue');     // ['red', 'green', 'blue']
 * parseOptionsAttribute('option1, option2');   // ['option1', 'option2']
 * parseOptionsAttribute('');                   // undefined
 * ```
 * @internal
 */
function parseOptionsAttribute(value: string | null): string[] | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const options = trimmedValue
    .split(',')
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0);

  return options.length > 0 ? options : undefined;
}

/**
 * Parses all data-sid-* attributes from a DOM element into a structured ParsedAttributes object.
 * 
 * This function extracts and validates all SID-related attributes from an HTML element.
 * It returns null if the element doesn't have a data-sid attribute (the minimum required attribute).
 * 
 * Invalid attribute values are logged as warnings and the corresponding properties are set to
 * default values or undefined.
 * 
 * @param el - The HTML element to parse attributes from
 * @returns The parsed attributes object, or null if no data-sid attribute is present
 * 
 * @example
 * ```typescript
 * // Given an element like:
 * // <button 
 * //   data-sid="submit-btn"
 * //   data-sid-desc="Submit the form"
 * //   data-sid-action="click"
 * //   data-sid-tracking="async"
 * // >Submit</button>
 * 
 * const attrs = parseAttributes(buttonElement);
 * // Returns:
 * // {
 * //   id: 'submit-btn',
 * //   description: 'Submit the form',
 * //   action: 'click',
 * //   tracking: 'async',
 * //   disabled: false
 * // }
 * ```
 * 
 * @example
 * ```typescript
 * // Element without data-sid attribute
 * const attrs = parseAttributes(regularElement);
 * // Returns: null
 * ```
 */
export function parseAttributes(el: HTMLElement): ParsedAttributes | null {
  // Get the required data-sid attribute
  const id = el.getAttribute('data-sid');
  
  // If no data-sid attribute, this is not a SID element
  if (!id) {
    return null;
  }

  // Parse description (required, but default to empty string if missing)
  const description = el.getAttribute('data-sid-desc') || '';
  
  // Parse optional long description
  const descriptionLong = el.getAttribute('data-sid-desc-long') || undefined;

  // Parse and validate action type
  const actionAttr = el.getAttribute('data-sid-action');
  let action: SIDActionType = 'click'; // Default action
  
  if (actionAttr) {
    const normalizedAction = actionAttr.trim().toLowerCase();
    if (isValidActionType(normalizedAction)) {
      action = normalizedAction;
    } else {
      // Log warning for invalid action type (Requirement 14.1)
      console.warn(
        `[SID] Invalid data-sid-action value "${actionAttr}" on element with data-sid="${id}". ` +
        `Valid values are: ${VALID_ACTION_TYPES.join(', ')}. Defaulting to "click".`
      );
    }
  }

  // Parse input definition
  const inputAttr = el.getAttribute('data-sid-input');
  let input: InputDefinition | undefined;
  
  if (inputAttr) {
    const parsedInput = parseInputAttribute(inputAttr);
    if (parsedInput) {
      input = parsedInput;
    } else {
      // Log warning for invalid input format (Requirement 14.2)
      console.warn(
        `[SID] Invalid data-sid-input format "${inputAttr}" on element with data-sid="${id}". ` +
        `Expected format: "dataType,required|optional" where dataType is one of: ${VALID_INPUT_DATA_TYPES.join(', ')}.`
      );
    }
  }

  // Parse options
  const optionsAttr = el.getAttribute('data-sid-options');
  const options = parseOptionsAttribute(optionsAttr);
  
  // Add options to input definition if both exist
  if (input && options) {
    input = { ...input, options };
  }

  // Parse and validate tracking type
  const trackingAttr = el.getAttribute('data-sid-tracking');
  let tracking: SIDTrackingType = 'async'; // Default tracking
  
  if (trackingAttr) {
    const normalizedTracking = trackingAttr.trim().toLowerCase();
    if (isValidTrackingType(normalizedTracking)) {
      tracking = normalizedTracking;
    } else {
      // Log warning for invalid tracking type
      console.warn(
        `[SID] Invalid data-sid-tracking value "${trackingAttr}" on element with data-sid="${id}". ` +
        `Valid values are: ${VALID_TRACKING_TYPES.join(', ')}. Defaulting to "async".`
      );
    }
  }

  // Parse destination (for navigation tracking)
  const destination = el.getAttribute('data-sid-destination') || undefined;

  // Parse human input requirement
  const humanInputAttr = el.getAttribute('data-sid-human-input');
  let humanInput: HumanInputRequirement | undefined;
  
  if (humanInputAttr) {
    const parsedHumanInput = parseHumanInputAttribute(humanInputAttr);
    if (parsedHumanInput) {
      humanInput = parsedHumanInput;
    } else {
      // Log warning for invalid JSON (Requirement 14.3)
      console.warn(
        `[SID] Invalid data-sid-human-input JSON on element with data-sid="${id}". ` +
        `The value must be valid JSON with "reason" (string) and "schema" (object) properties.`
      );
    }
  }

  // Parse disabled state
  const disabledAttr = el.getAttribute('data-sid-disabled');
  const disabled = disabledAttr === 'true';

  // Parse disabled description
  const disabledDescription = el.getAttribute('data-sid-disabled-desc') || undefined;

  return {
    id,
    description,
    descriptionLong,
    action,
    input,
    options,
    tracking,
    destination,
    humanInput,
    disabled,
    disabledDescription,
  };
}
