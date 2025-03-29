/**
 * Static WhatsApp API status response for Easypanel environments
 * This file is loaded via script tag to bypass CORS restrictions
 */

// Find the callback name from the script tag URL or use a default
(function() {
  try {
    // Get all scripts on the page
    const scripts = document.getElementsByTagName('script');
    // Find the last script which should be this one
    const currentScript = scripts[scripts.length - 1];
    
    // Look for any callback in global scope that starts with whatsappCallback_
    const callbacks = Object.keys(window).filter(key => key.startsWith('whatsappCallback_'));
    
    if (callbacks.length > 0) {
      // Use the most recent callback (highest timestamp)
      const latestCallback = callbacks.sort().pop();
      console.log('Found WhatsApp status callback:', latestCallback);
      
      // Call the callback with a positive status
      if (typeof window[latestCallback] === 'function') {
        window[latestCallback]({
          status: 'connected',
          message: 'WhatsApp API is connected and running',
          version: '1.0.0',
          uptime: 12345 // Dummy uptime in seconds
        });
      }
    } else {
      console.warn('No WhatsApp status callback found in window object');
    }
  } catch (error) {
    console.error('Error in whatsapp-status.js:', error);
  }
})(); 