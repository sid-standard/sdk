/**
 * SID Runtime - React Example
 * 
 * This example demonstrates using the SID runtime with React components
 * and the @sid-standard/react type augmentations for JSX support.
 * 
 * Requirements: 15.4, 15.5
 * 
 * Installation:
 *   npm install @sid-standard/runtime @sid-standard/react
 * 
 * The @sid-standard/react package provides TypeScript type augmentations
 * that enable autocomplete and type checking for data-sid-* attributes in JSX.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { init, destroy, type SIDAPI, type SIDElement } from '@sid-standard/runtime';

// Import React type augmentations (side-effect import for types)
import '@sid-standard/react';

// ============================================================================
// SID Context Provider
// ============================================================================

interface SIDContextValue {
  sid: SIDAPI | null;
  elements: SIDElement[];
  refreshElements: () => void;
}

const SIDContext = React.createContext<SIDContextValue>({
  sid: null,
  elements: [],
  refreshElements: () => {},
});

/**
 * Provider component that initializes the SID runtime
 */
export function SIDProvider({ children }: { children: React.ReactNode }) {
  const [sid, setSid] = useState<SIDAPI | null>(null);
  const [elements, setElements] = useState<SIDElement[]>([]);

  useEffect(() => {
    // Initialize SID runtime on mount
    const sidInstance = init({
      observeDOM: true,
      auth: {
        description: 'JWT Bearer token authentication',
        authenticate: async (token) => {
          // Implement your authentication logic here
          console.log('Authenticating agent with token');
          return token.length > 0;
        },
      },
    });

    setSid(sidInstance);

    // Initial element discovery
    setElements(sidInstance.getElements());

    // Cleanup on unmount
    return () => {
      destroy();
    };
  }, []);

  const refreshElements = useCallback(() => {
    if (sid) {
      setElements(sid.getElements());
    }
  }, [sid]);

  return (
    <SIDContext.Provider value={{ sid, elements, refreshElements }}>
      {children}
    </SIDContext.Provider>
  );
}

/**
 * Hook to access the SID runtime
 */
export function useSID() {
  return React.useContext(SIDContext);
}

// ============================================================================
// Contact Form Component
// ============================================================================

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  newsletter: boolean;
  priority: string;
}

/**
 * Example contact form with SID attributes
 */
export function ContactForm() {
  const { sid } = useSID();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    newsletter: false,
    priority: 'normal',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitResult('Form submitted successfully!');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>Contact Us</h2>

      {/* Text Input - demonstrates fill action */}
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          // SID attributes with full TypeScript support
          data-sid="contact-name-input"
          data-sid-desc="Enter your full name"
          data-sid-action="fill"
          data-sid-input="text,required"
          placeholder="John Doe"
          required
        />
      </div>

      {/* Email Input - demonstrates fill action with email type */}
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          data-sid="contact-email-input"
          data-sid-desc="Enter your email address"
          data-sid-desc-long="We'll use this email to respond to your inquiry. Your information is kept confidential."
          data-sid-action="fill"
          data-sid-input="email,required"
          placeholder="john@example.com"
          required
        />
      </div>

      {/* Select Dropdown - demonstrates select action */}
      <div className="form-group">
        <label htmlFor="subject">Subject</label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          data-sid="contact-subject-select"
          data-sid-desc="Select the subject of your inquiry"
          data-sid-action="select"
          data-sid-options="General Question,Technical Support,Sales Inquiry,Partnership,Other"
          required
        >
          <option value="">-- Select a subject --</option>
          <option value="General Question">General Question</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Sales Inquiry">Sales Inquiry</option>
          <option value="Partnership">Partnership</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Radio Buttons - demonstrates check action */}
      <div className="form-group">
        <label>Priority</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="priority"
              value="low"
              checked={formData.priority === 'low'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              data-sid="priority-low-radio"
              data-sid-desc="Set priority to low"
              data-sid-action="check"
            />
            Low
          </label>
          <label>
            <input
              type="radio"
              name="priority"
              value="normal"
              checked={formData.priority === 'normal'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              data-sid="priority-normal-radio"
              data-sid-desc="Set priority to normal"
              data-sid-action="check"
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              name="priority"
              value="high"
              checked={formData.priority === 'high'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              data-sid="priority-high-radio"
              data-sid-desc="Set priority to high"
              data-sid-action="check"
            />
            High
          </label>
        </div>
      </div>

      {/* Textarea - demonstrates fill action */}
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          data-sid="contact-message-input"
          data-sid-desc="Enter your message or question"
          data-sid-action="fill"
          data-sid-input="text,required"
          placeholder="How can we help you?"
          rows={4}
          required
        />
      </div>

      {/* Checkbox - demonstrates check action */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.newsletter}
            onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
            data-sid="newsletter-checkbox"
            data-sid-desc="Subscribe to our newsletter for updates"
            data-sid-action="check"
          />
          Subscribe to newsletter
        </label>
      </div>

      {/* Submit Button - demonstrates click action with tracking */}
      <div className="form-group">
        <button
          type="submit"
          disabled={isSubmitting}
          data-sid="contact-submit-button"
          data-sid-desc="Submit the contact form"
          data-sid-action="click"
          data-sid-tracking="async"
          data-sid-disabled={isSubmitting ? 'true' : 'false'}
          data-sid-disabled-desc={isSubmitting ? 'Form is being submitted' : undefined}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {submitResult && (
        <div className="submit-result" data-sid="submit-result" data-sid-desc="Form submission result message">
          {submitResult}
        </div>
      )}
    </form>
  );
}

// ============================================================================
// Navigation Component
// ============================================================================

/**
 * Example navigation with hover and click actions
 */
export function Navigation() {
  return (
    <nav
      data-sid="main-navigation"
      data-sid-desc="Main site navigation"
    >
      <ul>
        <li>
          <a
            href="/"
            data-sid="nav-home-link"
            data-sid-desc="Navigate to home page"
            data-sid-action="click"
            data-sid-tracking="navigation"
            data-sid-destination="/"
          >
            Home
          </a>
        </li>
        <li>
          <a
            href="/products"
            data-sid="nav-products-link"
            data-sid-desc="Navigate to products page"
            data-sid-action="click"
            data-sid-tracking="navigation"
            data-sid-destination="/products"
          >
            Products
          </a>
        </li>
        <li>
          {/* Dropdown menu with hover action */}
          <div
            className="dropdown"
            data-sid="nav-services-dropdown"
            data-sid-desc="Services dropdown menu - hover to expand"
            data-sid-action="hover"
          >
            <span>Services</span>
            <ul className="dropdown-menu">
              <li>
                <a
                  href="/services/consulting"
                  data-sid="nav-consulting-link"
                  data-sid-desc="Navigate to consulting services"
                  data-sid-action="click"
                  data-sid-tracking="navigation"
                >
                  Consulting
                </a>
              </li>
              <li>
                <a
                  href="/services/support"
                  data-sid="nav-support-link"
                  data-sid-desc="Navigate to support services"
                  data-sid-action="click"
                  data-sid-tracking="navigation"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </li>
        <li>
          <a
            href="/contact"
            data-sid="nav-contact-link"
            data-sid-desc="Navigate to contact page"
            data-sid-action="click"
            data-sid-tracking="navigation"
            data-sid-destination="/contact"
          >
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}

// ============================================================================
// File Upload Component
// ============================================================================

/**
 * Example file upload with upload action
 */
export function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="file-upload">
      <h3>Upload Document</h3>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        data-sid="document-upload-input"
        data-sid-desc="Upload a document (PDF, DOC, or DOCX)"
        data-sid-action="upload"
        data-sid-input="file,optional"
      />
      {selectedFile && (
        <p>Selected: {selectedFile.name}</p>
      )}
    </div>
  );
}

// ============================================================================
// Human Input Component
// ============================================================================

/**
 * Example component requiring human input for sensitive data
 */
export function PaymentForm() {
  return (
    <div className="payment-form">
      <h3>Payment Information</h3>
      <p>This form requires human input for security.</p>
      
      <input
        type="text"
        placeholder="Card Number"
        data-sid="payment-card-input"
        data-sid-desc="Enter credit card number"
        data-sid-action="fill"
        data-sid-input="text,required"
        data-sid-human-input={JSON.stringify({
          reason: "Credit card information requires human input for security",
          schema: {
            type: "object",
            properties: {
              cardNumber: {
                type: "string",
                title: "Card Number",
                "x-sid-sensitive": true
              },
              cvv: {
                type: "string",
                title: "CVV",
                "x-sid-sensitive": true
              }
            },
            required: ["cardNumber", "cvv"]
          },
          uiHints: {
            title: "Enter Payment Details"
          }
        })}
      />
    </div>
  );
}

// ============================================================================
// Debug Panel Component
// ============================================================================

/**
 * Debug panel showing discovered SID elements
 */
export function SIDDebugPanel() {
  const { sid, elements, refreshElements } = useSID();

  if (!sid) {
    return <div>Loading SID runtime...</div>;
  }

  return (
    <div className="debug-panel">
      <h3>SID Debug Panel</h3>
      
      <div className="context-info">
        <p><strong>Version:</strong> {sid.version}</p>
        <p><strong>App Context:</strong> {sid.getAppContext() || '(not set)'}</p>
        <p><strong>Page Context:</strong> {sid.getPageContext() || '(not set)'}</p>
      </div>

      <button onClick={refreshElements}>Refresh Elements</button>

      <div className="elements-list">
        <h4>Discovered Elements ({elements.length})</h4>
        <ul>
          {elements.map((element) => (
            <li key={element.id}>
              <strong>{element.id}</strong>
              <br />
              <small>{element.description}</small>
              <br />
              <small>Actions: {element.actions.map(a => a.type).join(', ')}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

/**
 * Main application component demonstrating SID integration
 */
export function App() {
  return (
    <SIDProvider>
      {/* SID Context Metadata - rendered as a script tag */}
      <script
        type="application/sid+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            version: '1.0.0',
            app: 'React Demo Application - Demonstrating SID integration with React',
            page: 'Contact Page - Submit inquiries and upload documents',
            auth: 'JWT Bearer token authentication supported',
          }),
        }}
      />

      <div className="app">
        <header>
          <h1>SID React Example</h1>
          <Navigation />
        </header>

        <main>
          <section>
            <ContactForm />
          </section>

          <section>
            <FileUpload />
          </section>

          <section>
            <PaymentForm />
          </section>
        </main>

        <aside>
          <SIDDebugPanel />
        </aside>
      </div>
    </SIDProvider>
  );
}

// Default export for the App component
export default App;
