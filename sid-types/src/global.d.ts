/**
 * Global Window interface augmentation for SID
 * 
 * This module augments the global Window interface to include the optional SID property.
 * When the SID runtime is initialized, window.SID will be available as a SIDAPI instance.
 */

import { SIDAPI } from './sid';

declare global {
  interface Window {
    /**
     * The SID (Semantic Interaction Description) API instance.
     * Available when the @sid-standard/runtime is initialized.
     * Use window.SID?.isSupported() to check if SID is available.
     */
    SID?: SIDAPI;
  }
}

export {};
