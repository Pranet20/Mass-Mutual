/**
 * Enterprise Client-Side Telemetry & APM Tracking Utility.
 * Records page views, user interactions, and performance metrics.
 */
import axios from 'axios';

class AnalyticsTracker {
  constructor() {
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
    this.queue = [];
    this.flushTimeout = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Track initial page load performance metrics (TTFB, DOMContentLoaded)
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const ttfb = timing.responseStart - timing.navigationStart;
            this.trackEvent('page_performance', 'performance', {
              page_load_ms: loadTime > 0 ? loadTime : null,
              ttfb_ms: ttfb > 0 ? ttfb : null,
              url: window.location.pathname
            }, loadTime > 0 ? loadTime : null);
          } catch (e) {
            // Ignore performance capture errors
          }
        }, 100);
      });
    }

    // Flush queued events when window unloads
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });
  }

  trackPageView(pageName) {
    this.trackEvent(pageName || window.location.pathname, 'page_view', {
      title: document.title,
      referrer: document.referrer || 'direct'
    });
  }

  trackEvent(eventName, eventType = 'action', metadata = {}, durationMs = null) {
    const payload = {
      event_name: eventName,
      event_type: eventType,
      page_url: window.location.pathname,
      metadata: metadata,
      duration_ms: durationMs,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.queue.push(payload);

    if (this.queue.length >= 5) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), 3000);
    }
  }

  async flush(sync = false) {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (sync && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify({ events: eventsToSend })], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/batch', blob);
        return;
      } catch (e) {
        // Fall back to fetch/axios
      }
    }

    try {
      await axios.post('/api/analytics/batch', { events: eventsToSend }, { headers });
    } catch (err) {
      // Non-blocking telemetry failure
      console.debug('Telemetry flush bypassed:', err.message);
    }
  }
}

export const analytics = new AnalyticsTracker();
export default analytics;
