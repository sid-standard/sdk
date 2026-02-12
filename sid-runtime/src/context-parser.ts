/**
 * @module context-parser
 * 
 * Parses SID context metadata from `<script type="application/sid+json">` tags.
 * This module extracts application-wide and page-specific context information
 * that helps AI agents understand the application.
 * 
 * @packageDocumentation
 */

/**
 * Represents the parsed context metadata from a SID context script.
 * This interface matches the Context Metadata Schema defined in the SID specification.
 */
export interface SIDContextMetadata {
  /** SID specification version */
  version?: string;
  /** Application-wide context description */
  app?: string;
  /** Current page context description */
  page?: string;
  /** Authentication method description */
  auth?: string;
}

/**
 * Cached context metadata to avoid repeated DOM queries and parsing.
 * @internal
 */
let cachedContext: SIDContextMetadata | null = null;

/**
 * Flag indicating whether the context has been parsed.
 * @internal
 */
let contextParsed = false;

/**
 * Parses the SID context metadata from the document.
 * 
 * This function searches for a `<script type="application/sid+json">` tag in the document
 * and parses its JSON content. The result is cached for subsequent calls.
 * 
 * @returns The parsed context metadata, or an empty object if no context script is found or parsing fails
 * @internal
 */
function parseContextScript(): SIDContextMetadata {
  // Return cached result if already parsed
  if (contextParsed) {
    return cachedContext || {};
  }

  contextParsed = true;

  // Check if we're in a browser environment with document access
  if (typeof document === 'undefined') {
    return {};
  }

  try {
    // Find the SID context script tag
    const scriptElement = document.querySelector('script[type="application/sid+json"]');
    
    if (!scriptElement) {
      // No context script found - this is a valid state (Requirement 6.5)
      cachedContext = null;
      return {};
    }

    const scriptContent = scriptElement.textContent;
    
    if (!scriptContent || !scriptContent.trim()) {
      // Empty script content
      cachedContext = null;
      return {};
    }

    // Parse the JSON content
    const parsed = JSON.parse(scriptContent.trim());
    
    // Validate that parsed result is an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn(
        '[SID] Invalid context script content: expected a JSON object. ' +
        'Context metadata will be empty.'
      );
      cachedContext = null;
      return {};
    }

    // Cache and return the parsed context
    cachedContext = {
      version: typeof parsed.version === 'string' ? parsed.version : undefined,
      app: typeof parsed.app === 'string' ? parsed.app : undefined,
      page: typeof parsed.page === 'string' ? parsed.page : undefined,
      auth: typeof parsed.auth === 'string' ? parsed.auth : undefined,
    };

    return cachedContext;
  } catch (error) {
    // JSON parsing failed - handle gracefully
    console.warn(
      '[SID] Failed to parse context script JSON. ' +
      'Ensure the <script type="application/sid+json"> contains valid JSON. ' +
      'Context metadata will be empty.',
      error instanceof Error ? error.message : error
    );
    cachedContext = null;
    return {};
  }
}

/**
 * Gets the application context description from the SID context metadata.
 * 
 * @returns The application context string, or an empty string if not defined
 */
export function getAppContext(): string {
  const context = parseContextScript();
  return context.app || '';
}

/**
 * Gets the page context description from the SID context metadata.
 * 
 * @returns The page context string, or an empty string if not defined
 */
export function getPageContext(): string {
  const context = parseContextScript();
  return context.page || '';
}

/**
 * Gets the authentication description from the SID context metadata.
 * 
 * @returns The authentication description string, or an empty string if not defined
 */
export function getAuthDescription(): string {
  const context = parseContextScript();
  return context.auth || '';
}

/**
 * Gets the full parsed context metadata object.
 * 
 * @returns The full context metadata object
 */
export function getContextMetadata(): SIDContextMetadata {
  return parseContextScript();
}

/**
 * Clears the cached context metadata.
 * 
 * This function is useful when the context script may have changed
 * (e.g., during SPA navigation) and you need to re-parse the context.
 */
export function clearContextCache(): void {
  cachedContext = null;
  contextParsed = false;
}
