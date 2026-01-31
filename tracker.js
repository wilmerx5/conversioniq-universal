/**
 * ConversionIQ - Universal Tracking Script
 * Version: 1.1.0
 * Works on any website (WordPress, static HTML, React, Vue, Next.js, etc.)
 * Tracks page views, clicks, scroll depth, form interactions, and checkout events
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
  // CHECKOUT TRACKING
  // Comprehensive checkout detection for Next.js, React, and other SPA frameworks
  // ============================================
  const checkoutTracking = {
    activeCheckouts: new Map(), // checkoutId -> { startTime, checkoutPath, method }
    completedCheckouts: new Set(), // Track completed to prevent duplicates
    lastPath: location.pathname,
  };

  /**
   * Check if current path is a checkout page
   * @param {string} path - URL path
   * @returns {boolean}
   */
  function isCheckoutPage(path) {
    if (!path) return false;
    const lowerPath = path.toLowerCase();
    const checkoutPatterns = [
      /\/checkout/,
      /\/cart/,
      /\/carrito/,
      /\/pagar/,
      /\/payment/,
      /\/pago/,
      /\/order/,
      /\/orden/,
      /\/buy/,
      /\/comprar/,
      /\/purchase/,
      /\/compra/,
    ];
    return checkoutPatterns.some(pattern => pattern.test(lowerPath));
  }

  /**
   * Check if current path is a success/confirmation page
   * @param {string} path - URL path
   * @returns {boolean}
   */
  function isSuccessPage(path) {
    if (!path) return false;
    const lowerPath = path.toLowerCase();
    const successPatterns = [
      /\/success/,
      /\/exito/,
      /\/thank.?you/,
      /\/gracias/,
      /\/confirmation/,
      /\/confirmacion/,
      /\/order-confirmed/,
      /\/orden-confirmada/,
      /\/complete/,
      /\/completado/,
      /\/done/,
      /\/finalizado/,
    ];
    return successPatterns.some(pattern => pattern.test(lowerPath));
  }

  /**
   * Check DOM for success indicators
   * @returns {boolean}
   */
  function detectSuccessInDOM() {
    // Common success indicators
    const successSelectors = [
      '[class*="success"]',
      '[class*="complete"]',
      '[class*="confirmed"]',
      '[id*="success"]',
      '[id*="complete"]',
      '[id*="confirmed"]',
      '[data-status="success"]',
      '[data-status="complete"]',
      '[data-status="confirmed"]',
      '.order-confirmation',
      '.checkout-success',
      '.payment-success',
      '[aria-label*="success" i]',
      '[aria-label*="complete" i]',
    ];

    for (const selector of successSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('success') || text.includes('complete') || 
              text.includes('confirmed') || text.includes('order') ||
              text.includes('exito') || text.includes('completado') ||
              text.includes('confirmado') || text.includes('orden')) {
            return true;
          }
        }
      } catch (e) {
        // Invalid selector, continue
      }
    }
    return false;
  }

  /**
   * Check localStorage/sessionStorage for order data
   * @returns {boolean}
   */
  function detectOrderInStorage() {
    try {
      const keys = [];
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        keys.push(sessionStorage.key(i));
      }

      const orderIndicators = keys.filter(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('order') || lowerKey.includes('orden') ||
               lowerKey.includes('checkout') || lowerKey.includes('purchase') ||
               lowerKey.includes('compra') || lowerKey.includes('transaction');
      });

      if (orderIndicators.length > 0) {
        // Check if any contains actual order data
        for (const key of orderIndicators) {
          try {
            const value = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (value && (value.includes('id') || value.includes('status') || value.includes('total'))) {
              return true;
            }
          } catch (e) {
            // Continue
          }
        }
      }
    } catch (e) {
      // Storage not available
    }
    return false;
  }

  /**
   * Track checkout activation
   * @param {string} checkoutPath - Path where checkout was activated
   * @param {string} method - How checkout was detected ('url', 'form', 'click', 'custom')
   */
  function trackCheckoutActivation(checkoutPath, method = 'url') {
    const checkoutId = `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // Prevent duplicate activations for same path within short time
    const recentActivation = Array.from(checkoutTracking.activeCheckouts.values())
      .find(c => c.checkoutPath === checkoutPath && (Date.now() - c.startTime) < 5000);
    
    if (recentActivation) {
      return; // Already tracked recently
    }

    checkoutTracking.activeCheckouts.set(checkoutId, {
      startTime: Date.now(),
      checkoutPath: checkoutPath,
      method: method,
    });

    send({
      eventId: eventId('checkout-activate'),
      eventType: 'checkout_activate',
      occurredAt: new Date().toISOString(),
      page: {
        path: checkoutPath,
        title: document.title,
      },
      checkout: {
        checkoutId: checkoutId,
        method: method,
      },
    });
  }

  /**
   * Track checkout completion
   * @param {string} successPath - Path where completion was detected
   * @param {string} method - How completion was detected
   * @param {string} checkoutId - Optional specific checkout ID
   */
  function trackCheckoutCompletion(successPath, method = 'url', checkoutId = null) {
    // Prevent duplicate completions
    const completionKey = `${successPath}-${Date.now()}`;
    if (checkoutTracking.completedCheckouts.has(completionKey)) {
      return;
    }
    checkoutTracking.completedCheckouts.add(completionKey);

    // Find matching active checkout
    let activeCheckout = null;
    if (checkoutId && checkoutTracking.activeCheckouts.has(checkoutId)) {
      activeCheckout = checkoutTracking.activeCheckouts.get(checkoutId);
    } else {
      // Find most recent active checkout
      const activeCheckouts = Array.from(checkoutTracking.activeCheckouts.entries())
        .sort((a, b) => b[1].startTime - a[1].startTime);
      if (activeCheckouts.length > 0) {
        activeCheckout = { id: activeCheckouts[0][0], ...activeCheckouts[0][1] };
      }
    }

    const timeToComplete = activeCheckout
      ? Math.max(1, Math.round((Date.now() - activeCheckout.startTime) / 1000))
      : null;

    send({
      eventId: eventId('checkout-complete'),
      eventType: 'checkout_complete',
      occurredAt: new Date().toISOString(),
      page: {
        path: successPath,
        title: document.title,
      },
      checkout: {
        checkoutId: activeCheckout?.id || 'unknown',
        method: method,
        timeToComplete: timeToComplete,
        checkoutPath: activeCheckout?.checkoutPath || null,
      },
    });

    // Cleanup active checkout
    if (activeCheckout && activeCheckout.id) {
      checkoutTracking.activeCheckouts.delete(activeCheckout.id);
    }
  }

  /**
   * Check for checkout completion using all available methods
   */
  function checkForCheckoutCompletion() {
    const currentPath = location.pathname;

    // Method 1: URL-based detection (success page)
    if (isSuccessPage(currentPath)) {
      trackCheckoutCompletion(currentPath, 'url');
      return;
    }

    // Method 2: DOM-based detection
    if (detectSuccessInDOM()) {
      trackCheckoutCompletion(currentPath, 'dom');
      return;
    }

    // Method 3: Storage-based detection
    if (detectOrderInStorage()) {
      trackCheckoutCompletion(currentPath, 'storage');
      return;
    }
  }

  // Track checkout activation on checkout pages
  if (isCheckoutPage(location.pathname)) {
    trackCheckoutActivation(location.pathname, 'url');
  }

  // Monitor URL changes (for SPAs like Next.js, React Router, etc.)
  let urlCheckInterval = null;
  function startUrlMonitoring() {
    // Check URL changes periodically (for SPAs)
    urlCheckInterval = setInterval(() => {
      const currentPath = location.pathname;
      
      // Detect checkout activation
      if (isCheckoutPage(currentPath) && currentPath !== checkoutTracking.lastPath) {
        trackCheckoutActivation(currentPath, 'url');
      }
      
      // Detect checkout completion
      if (currentPath !== checkoutTracking.lastPath) {
        checkForCheckoutCompletion();
        checkoutTracking.lastPath = currentPath;
      }
    }, 500); // Check every 500ms

    // Also use popstate for browser navigation
    window.addEventListener('popstate', () => {
      const currentPath = location.pathname;
      if (isCheckoutPage(currentPath)) {
        trackCheckoutActivation(currentPath, 'url');
      }
      checkForCheckoutCompletion();
      checkoutTracking.lastPath = currentPath;
    });
  }

  // Listen for Next.js router events (if available)
  if (typeof window !== 'undefined' && window.next && window.next.router) {
    const router = window.next.router;
    if (router.events) {
      router.events.on('routeChangeComplete', (url) => {
        const path = new URL(url, location.origin).pathname;
        if (isCheckoutPage(path)) {
          trackCheckoutActivation(path, 'nextjs-router');
        }
        if (isSuccessPage(path) || isCheckoutPage(checkoutTracking.lastPath)) {
          checkForCheckoutCompletion();
        }
        checkoutTracking.lastPath = path;
      });
    }
  }

  // Listen for custom checkout events
  window.addEventListener('checkout:activate', (e) => {
    const path = e.detail?.path || location.pathname;
    trackCheckoutActivation(path, 'custom-event');
  });

  window.addEventListener('checkout:complete', (e) => {
    const path = e.detail?.path || location.pathname;
    const checkoutId = e.detail?.checkoutId || null;
    trackCheckoutCompletion(path, 'custom-event', checkoutId);
  });

  window.addEventListener('order:complete', (e) => {
    const path = e.detail?.path || location.pathname;
    trackCheckoutCompletion(path, 'custom-event');
  });

  window.addEventListener('purchase:complete', (e) => {
    const path = e.detail?.path || location.pathname;
    trackCheckoutCompletion(path, 'custom-event');
  });

  // Track checkout form submissions
  document.addEventListener('submit', (e) => {
    if (!e.target || e.target.tagName !== 'FORM') return;
    
    const form = e.target;
    const formPath = location.pathname;
    
    // Check if form is on checkout page or has checkout-related classes/ids
    const formId = (form.id || '').toLowerCase();
    const formClass = (form.className || '').toLowerCase();
    const formAction = (form.action || '').toLowerCase();
    
    const isCheckoutForm = isCheckoutPage(formPath) ||
      formId.includes('checkout') || formId.includes('cart') || formId.includes('payment') ||
      formClass.includes('checkout') || formClass.includes('cart') || formClass.includes('payment') ||
      formAction.includes('checkout') || formAction.includes('cart') || formAction.includes('payment');
    
    if (isCheckoutForm) {
      // Track activation if not already tracked
      if (!isCheckoutPage(formPath)) {
        trackCheckoutActivation(formPath, 'form');
      }
      
      // Wait a bit then check for completion (form might redirect or show success)
      setTimeout(() => {
        checkForCheckoutCompletion();
      }, 1000);
    }
  }, true);

  // Track clicks on checkout/purchase buttons
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a, [role="button"]');
    if (!el) return;

    const text = (el.textContent || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const className = (el.className || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    
    const isCheckoutButton = 
      text.includes('checkout') || text.includes('pagar') || text.includes('comprar') ||
      text.includes('buy now') || text.includes('purchase') || text.includes('order') ||
      id.includes('checkout') || id.includes('purchase') || id.includes('buy') ||
      className.includes('checkout') || className.includes('purchase') || className.includes('buy') ||
      ariaLabel.includes('checkout') || ariaLabel.includes('purchase') || ariaLabel.includes('buy');

    if (isCheckoutButton) {
      const currentPath = location.pathname;
      trackCheckoutActivation(currentPath, 'click');
      
      // Also check for completion after a delay (in case it's instant)
      setTimeout(() => {
        checkForCheckoutCompletion();
      }, 2000);
    }
  }, true);

  // Monitor DOM for success messages (MutationObserver)
  const successObserver = new MutationObserver(() => {
    if (checkoutTracking.activeCheckouts.size > 0) {
      checkForCheckoutCompletion();
    }
  });

  // Start monitoring after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startUrlMonitoring();
      successObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'data-status'],
      });
      // Initial check
      checkForCheckoutCompletion();
    });
  } else {
    startUrlMonitoring();
    successObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-status'],
    });
    // Initial check
    checkForCheckoutCompletion();
  }

  // Periodic check for completion (fallback)
  setInterval(() => {
    if (checkoutTracking.activeCheckouts.size > 0) {
      checkForCheckoutCompletion();
    }
  }, 3000); // Check every 3 seconds

  // Cleanup old active checkouts (prevent memory leak)
  setInterval(() => {
    const now = Date.now();
    for (const [id, data] of checkoutTracking.activeCheckouts.entries()) {
      // Remove checkouts older than 1 hour
      if (now - data.startTime > 3600000) {
        checkoutTracking.activeCheckouts.delete(id);
      }
    }
  }, 60000); // Check every minute

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

    // Log event registration
    if (typeof console !== 'undefined' && console.log) {
      console.log('registrando evento w.w', payload.eventType, payload);
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
