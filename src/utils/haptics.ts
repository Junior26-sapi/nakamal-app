import { feedbackService } from '../services/feedbackService';

/**
 * Haptic feedback helper utility for UI interactions.
 * Automatically enables page-wide tactile response for buttons and other touchable components,
 * and exposes discrete manual triggers for custom-made UI elements.
 */

// Simple state to track initialization
let isInitialized = false;

export const hapticUtility = {
  /**
   * Initializes global tactile haptic listeners.
   * Scans pointer down interactions on any button or element with role="button"
   * to automatically trigger standard mobile vibration.
   */
  initButtonHaptics() {
    if (typeof window === 'undefined' || isInitialized) return;

    // Use pointerdown for ultra-low latency haptic feed on touch devices
    const handlePointerDown = (event: PointerEvent) => {
      // Avoid firing on mouse clicks that aren't touch pointer types if desired,
      // but typical mobile web tests usually treat touch events as pointer events with pointerType "touch" or "pen".
      // To provide high premium feel across mobile phones/tablets, we allow all pointerTypes,
      // which safely defaults to vibrating on real mobile touch devices while remaining a no-op on desktops without a vibrator motor.
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest('button, [role="button"], [data-haptic]');
      if (!interactiveEl) return;

      // Ensure it is not disabled or explicitly muted
      const isDisabled = interactiveEl.hasAttribute('disabled') || 
                         interactiveEl.getAttribute('aria-disabled') === 'true' ||
                         interactiveEl.classList.contains('disabled');
      
      const hapticType = interactiveEl.getAttribute('data-haptic');
      if (isDisabled || hapticType === 'none') return;

      // Standardize haptic pattern
      const pattern = (hapticType || 'tap') as 'tap' | 'type' | 'notify' | 'success' | 'warn';
      
      // Trigger haptic vibration via feedbackService
      feedbackService.vibrate(pattern);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    isInitialized = true;
    console.log('[HAPTICS] Global tactile haptic feedback initialized for interactive controls.');
  },

  /**
   * Triggers a manual haptic pattern on demand.
   * Safe to call anywhere without risking uncaught reference errors.
   */
  trigger(pattern: 'tap' | 'type' | 'notify' | 'success' | 'warn' | number | number[]) {
    feedbackService.vibrate(pattern);
  }
};
