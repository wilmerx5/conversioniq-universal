/**
 * ConversionIQ - Universal Tracking Script
 * Version: 1.0.0
 * Works on any website (WordPress, static HTML, React, Vue, etc.)
 * Tracks page views, clicks, scroll depth, and form interactions
 */
(function () {
  'use strict';

  // ============================================
  // API KEY RESOLUTION
  // Reads API key from multiple sources (priority order)
  // ============================================
  function getApiKey() {
    // Priority 1: data-api-key attribute on script tag
    const currentScript = document.currentScript || 
      (function() {
        const scripts = document.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i--) {
          if (scripts[i].dataset && scripts[i].dataset.apiKey) {
            return scripts[i];
          }
        }
        return null;
      })();
    
    if (currentScript && currentScript.dataset && currentScript.dataset.apiKey) {
      return currentScript.dataset.apiKey.trim();
    }

    // Priority 2: Global variable window.CIQ_API_KEY (or legacy WPCM_API_KEY)
    if (typeof window !== 'undefined' && window.CIQ_API_KEY) {
      return String(window.CIQ_API_KEY).trim();
    }
    // Legacy support: window.WPCM_API_KEY
    if (typeof window !== 'undefined' && window.WPCM_API_KEY) {
      return String(window.WPCM_API_KEY).trim();
    }

    // Priority 3: localStorage (for dynamic configuration)
    try {
      const stored = localStorage.getItem('ciq_api_key') || localStorage.getItem('wpcm_api_key');
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch (e) {
      // localStorage not available (private browsing, etc.)
    }

    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    // Silently fail - don't break sites that don't have API key configured
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[ConversionIQ] API key not found. Tracking disabled. Please configure your API key.');
    }
    return;
  }

  // ============================================
  // CONFIGURATION
  // ============================================
  const API_BASE = 'https://wp-conversion-monitor.onrender.com';
  const endpoint = `${API_BASE}/events`;
  const domain = window.location.hostname;

  // Track if we've already sent events to prevent duplicates
  const sentEvents = new Set();

  // ============================================
  // EVENT SENDING
  // Sends events directly to API with authentication
  // ============================================
  /**
   * Send event to backend API
   * @param {Object} payload - Event payload
   * @returns {boolean} - Whether send was successful
   */
  function send(payload) {
    // Prevent duplicate events
    const eventKey = `${payload.eventType}-${payload.eventId}`;
    if (sentEvents.has(eventKey)) {
      return false;
    }
    sentEvents.add(eventKey);

    // Ensure occurredAt is always present and valid
    if (!payload.occurredAt || !payload.occurredAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      payload.occurredAt = new Date().toISOString();
    }

    // Validate required fields
    if (!payload.eventId || !payload.eventType || !payload.page || !payload.page.path) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[ConversionIQ] Invalid event payload:', payload);
      }
      return false;
    }

    // Prepare headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-CIQ-Domain': domain,
      'X-WPCM-Domain': domain, // Legacy support
    };

    try {
      // Prefer sendBeacon for better reliability (but it doesn't support custom headers)
      // So we'll use fetch with keepalive for better compatibility
      const fetchOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        keepalive: true,
        mode: 'cors',
      };

      // Try fetch with keepalive (better than sendBeacon for authenticated requests)
      fetch(endpoint, fetchOptions).catch(() => {
        // Silently fail - fire and forget
      });
      return true;
    } catch (e) {
      // Fallback: try sendBeacon without auth (will fail but won't break)
      try {
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json'
        });
        navigator.sendBeacon && navigator.sendBeacon(endpoint, blob);
      } catch (beaconError) {
        // Silently fail
      }
      return false;
    }
  }

  // ============================================
  // UTILITIES
  // ============================================
  /**
   * Generate unique event ID
   * @param {string} prefix - Event prefix
   * @returns {string} - Unique event ID
   */
  function eventId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}-${(typeof performance !== 'undefined' && performance.now) 
        ? performance.now().toString(36).slice(2, 8) 
        : Math.random().toString(36).slice(2, 8)}`;
  }

  // ============================================
  // PAGE VIEW TRACKING
  // ============================================
  send({
    eventId: eventId('page'),
    eventType: 'page_view',
    occurredAt: new Date().toISOString(),
    page: {
      path: location.pathname,
      referrerPath: document.referrer || null,
      title: document.title,
    },
  });

  // ============================================
  // CLICK TRACKING
  // ============================================
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a,button');
    if (!el) return;

    send({
      eventId: eventId('click'),
      eventType: 'click',
      occurredAt: new Date().toISOString(),
      page: {
        path: location.pathname,
        title: document.title,
      },
      element: {
        kind: el.tagName.toLowerCase(),
        label: el.innerText?.slice(0, 80) || '',
        selector: el.className || '',
        href: el.href || null,
      },
    });
  });

  // ============================================
  // SCROLL TRACKING
  // ============================================
  const marks = [25, 50, 75, 100];
  const sent = new Set();

  window.addEventListener('scroll', () => {
    const percent = Math.round(
      ((window.scrollY + window.innerHeight) /
        document.body.scrollHeight) *
        100
    );

    marks.forEach((m) => {
      if (percent >= m && !sent.has(m)) {
        sent.add(m);

        send({
          eventId: eventId(`scroll-${m}`),
          eventType: 'scroll',
          occurredAt: new Date().toISOString(),
          page: {
            path: location.pathname,
            title: document.title,
          },
          scroll: { percent: m },
        });
      }
    });
  });

  // ============================================
  // FORM TRACKING
  // Enhanced form analytics with better provider detection
  // ============================================
  const formTracking = {
    startedForms: new Map(), // formId -> { startTime, firstField, formName, provider }
    focusedFields: new Map(), // formId -> Set of field names
    viewedForms: new Set(), // Track which forms have been viewed to prevent duplicates
  };

  /**
   * Detect form provider more accurately
   * @param {HTMLElement} form - Form element
   * @returns {string} - Provider name
   */
  function detectFormProvider(form) {
    // Check parent containers first (more reliable)
    if (form.closest('.wpcf7')) return 'Contact Form 7';
    if (form.closest('.gform_wrapper')) return 'Gravity Forms';
    if (form.closest('.wpforms-container, .wpforms-form')) return 'WPForms';
    if (form.closest('.forminator-form')) return 'Forminator';
    if (form.closest('.nf-form-cont')) return 'Ninja Forms';
    if (form.closest('.caldera-form')) return 'Caldera Forms';
    if (form.closest('.fluentform')) return 'Fluent Forms';
    
    // Check form class names
    if (form.classList.contains('wpcf7-form')) return 'Contact Form 7';
    if (form.classList.contains('gform_wrapper') || form.classList.contains('gravity-form')) return 'Gravity Forms';
    if (form.classList.contains('wpforms-form')) return 'WPForms';
    if (form.classList.contains('forminator-form')) return 'Forminator';
    
    // Check for data attributes
    if (form.hasAttribute('data-formid') && form.getAttribute('class')?.includes('wpforms')) return 'WPForms';
    
    // Generic form builders
    if (form.closest('.hubspot-form')) return 'HubSpot';
    if (form.closest('.mailchimp-form')) return 'Mailchimp';
    if (form.closest('.typeform-form')) return 'Typeform';
    
    return 'native';
  }

  /**
   * Track form view (when form becomes visible)
   * @param {HTMLElement} form - Form element
   */
  function trackFormView(form) {
    if (!form || form.tagName !== 'FORM') return;

    const formId = form.id || form.name || form.className?.split(' ')[0] || 'form-' + Math.random().toString(36).slice(2, 11);
    
    // Prevent duplicate form_view events
    if (formTracking.viewedForms.has(formId)) return;
    formTracking.viewedForms.add(formId);

    const formName = form.getAttribute('name') || form.getAttribute('aria-label') || form.id || form.querySelector('legend')?.textContent?.trim() || 'Untitled Form';
    const provider = detectFormProvider(form);

    send({
      eventId: eventId('form-view'),
      eventType: 'form_view',
      occurredAt: new Date().toISOString(),
      page: {
        path: location.pathname,
        title: document.title,
      },
      form: {
        formId: formId,
        formName: formName.substring(0, 80), // Ensure max length
        provider: provider,
      },
    });
  }

  /**
   * Track form start (first field interaction)
   * @param {HTMLElement} form - Form element
   * @param {string} fieldName - Name of first focused field
   */
  function trackFormStart(form, fieldName) {
    if (!form) return;

    const formId = form.id || form.name || form.className?.split(' ')[0] || 'form-unknown';
    if (formTracking.startedForms.has(formId)) return;

    const formName = form.getAttribute('name') || form.getAttribute('aria-label') || form.id || form.querySelector('legend')?.textContent?.trim() || 'Untitled Form';
    const provider = detectFormProvider(form);

    formTracking.startedForms.set(formId, {
      startTime: Date.now(),
      firstField: fieldName,
      formName: formName,
      provider: provider,
    });

    send({
      eventId: eventId('form-start'),
      eventType: 'form_start',
      occurredAt: new Date().toISOString(),
      page: {
        path: location.pathname,
        title: document.title,
      },
      form: {
        formId: formId,
        formName: formName.substring(0, 80),
        provider: provider,
      },
    });
  }

  /**
   * Track form submission
   * @param {HTMLElement} form - Form element
   */
  function trackFormSubmit(form) {
    if (!form) return;

    const formId = form.id || form.name || form.className?.split(' ')[0] || 'form-unknown';
    const startData = formTracking.startedForms.get(formId);
    const formName = startData?.formName || form.getAttribute('name') || form.getAttribute('aria-label') || form.id || form.querySelector('legend')?.textContent?.trim() || 'Untitled Form';
    const provider = startData?.provider || detectFormProvider(form);

    // Calculate time to complete (in seconds)
    const timeToComplete = startData 
      ? Math.max(1, Math.round((Date.now() - startData.startTime) / 1000))
      : null;

    // Count fields completed
    const fieldsCompleted = formTracking.focusedFields.get(formId)?.size || 0;

    send({
      eventId: eventId('form-submit'),
      eventType: 'form_submit',
      occurredAt: new Date().toISOString(),
      page: {
        path: location.pathname,
        title: document.title,
      },
      form: {
        formId: formId,
        formName: formName.substring(0, 80),
        provider: provider,
        timeToComplete: timeToComplete,
        fieldsCompleted: fieldsCompleted > 0 ? fieldsCompleted : undefined,
      },
    });

    // Cleanup
    formTracking.startedForms.delete(formId);
    formTracking.focusedFields.delete(formId);
  }

  /**
   * Track form abandonment (user leaves form without submitting)
   * @param {HTMLElement} form - Form element
   */
  function trackFormAbandon(form) {
    if (!form) return;

    const formId = form.id || form.name || form.className?.split(' ')[0] || 'form-unknown';
    const startData = formTracking.startedForms.get(formId);
    if (!startData) return; // Only track if form was started

    const formName = startData.formName || form.getAttribute('name') || form.getAttribute('aria-label') || form.id || 'Untitled Form';
    const provider = startData.provider || detectFormProvider(form);
    const timeSpent = Math.max(1, Math.round((Date.now() - startData.startTime) / 1000));
    const fieldsCompleted = formTracking.focusedFields.get(formId)?.size || 0;

    send({
      eventId: eventId('form-abandon'),
      eventType: 'form_abandon',
      occurredAt: new Date().toISOString(),
      page: {
        path: location.pathname,
        title: document.title,
      },
      form: {
        formId: formId,
        formName: formName.substring(0, 80),
        provider: provider,
        timeSpent: timeSpent,
        fieldsCompleted: fieldsCompleted > 0 ? fieldsCompleted : undefined,
      },
    });

    // Cleanup after delay (in case user comes back)
    setTimeout(() => {
      formTracking.startedForms.delete(formId);
      formTracking.focusedFields.delete(formId);
    }, 30000); // 30 seconds - user might come back
  }

  // Initialize form tracking on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormTracking);
  } else {
    initFormTracking();
  }

  function initFormTracking() {
    // Track forms already on page
    document.querySelectorAll('form').forEach(trackFormView);

    // Watch for dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'FORM') {
              trackFormView(node);
            }
            node.querySelectorAll && node.querySelectorAll('form').forEach(trackFormView);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Track form field interactions
    document.addEventListener('focusin', (e) => {
      const field = e.target;
      if (!field || !field.closest('form')) return;

      const form = field.closest('form');
      const formId = form.id || form.name || form.className;
      const fieldName = field.name || field.id || field.type || 'unknown';

      // Track form start on first field focus
      trackFormStart(form, fieldName);

      // Track focused field
      if (!formTracking.focusedFields.has(formId)) {
        formTracking.focusedFields.set(formId, new Set());
      }
      formTracking.focusedFields.get(formId).add(fieldName);
    }, true);

    // Track form submits
    document.addEventListener('submit', (e) => {
      if (!e.target || e.target.tagName !== 'FORM') return;
      trackFormSubmit(e.target);
    }, true);

    // Track form abandon (blur from form without submit)
    document.addEventListener('focusout', (e) => {
      const field = e.target;
      if (!field || !field.closest('form')) return;

      const form = field.closest('form');
      
      // Check if focus moved outside form
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!form.contains(activeElement)) {
          trackFormAbandon(form);
        }
      }, 100);
    }, true);

    // Track validation errors (HTML5 native validation)
    document.addEventListener('invalid', (e) => {
      const field = e.target;
      if (!field || !field.closest('form')) return;

      const form = field.closest('form');
      const formId = form.id || form.name || form.className?.split(' ')[0] || 'form-unknown';
      const fieldName = field.name || field.id || field.type || field.getAttribute('placeholder') || 'unknown';
      const startData = formTracking.startedForms.get(formId);
      const formName = startData?.formName || form.getAttribute('name') || form.getAttribute('aria-label') || form.id || 'Untitled Form';
      const provider = startData?.provider || detectFormProvider(form);

      send({
        eventId: eventId('form-error'),
        eventType: 'form_field_error',
        occurredAt: new Date().toISOString(),
        page: {
          path: location.pathname,
          title: document.title,
        },
        form: {
          formId: formId,
          formName: formName.substring(0, 80),
          provider: provider,
        },
        element: {
          kind: field.tagName.toLowerCase(),
          label: fieldName.substring(0, 80),
        },
      });
    }, true);
  }
})();
