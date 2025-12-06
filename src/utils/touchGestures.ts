/**
 * Touch Gesture Utilities
 * Requirements: Add touch-friendly interactions, optimize chart manipulation for touch,
 * implement touch gestures (pinch zoom, swipe)
 */

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  distance: number;
}

export interface TapGesture {
  x: number;
  y: number;
  count: number; // 1 for single tap, 2 for double tap
}

/**
 * Calculate distance between two touch points
 */
export function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches
 */
export function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

/**
 * Detect swipe gesture from touch events
 */
export function detectSwipe(
  startPoint: TouchPoint,
  endPoint: TouchPoint,
  minDistance: number = 50,
  maxDuration: number = 300
): SwipeGesture | null {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = endPoint.timestamp - startPoint.timestamp;

  // Check if swipe meets minimum distance and maximum duration
  if (distance < minDistance || duration > maxDuration) {
    return null;
  }

  const velocity = distance / duration;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine swipe direction based on angle
  let direction: SwipeGesture['direction'];
  if (angle >= -45 && angle < 45) {
    direction = 'right';
  } else if (angle >= 45 && angle < 135) {
    direction = 'down';
  } else if (angle >= -135 && angle < -45) {
    direction = 'up';
  } else {
    direction = 'left';
  }

  return {
    direction,
    distance,
    velocity,
    duration,
  };
}

/**
 * Detect pinch gesture from touch events
 */
export function detectPinch(
  initialDistance: number,
  currentDistance: number,
  touch1: Touch,
  touch2: Touch
): PinchGesture {
  const scale = currentDistance / initialDistance;
  const center = getTouchCenter(touch1, touch2);

  return {
    scale,
    center,
    distance: currentDistance,
  };
}

/**
 * Check if touch is a tap (short duration, minimal movement)
 */
export function isTap(
  startPoint: TouchPoint,
  endPoint: TouchPoint,
  maxDistance: number = 10,
  maxDuration: number = 200
): boolean {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = endPoint.timestamp - startPoint.timestamp;

  return distance <= maxDistance && duration <= maxDuration;
}

/**
 * Touch gesture handler class
 */
export class TouchGestureHandler {
  private element: HTMLElement;
  private startPoint: TouchPoint | null = null;
  private initialPinchDistance: number | null = null;
  private lastTapTime: number = 0;

  // Callbacks
  private onSwipe?: (gesture: SwipeGesture) => void;
  private onPinch?: (gesture: PinchGesture) => void;
  private onTap?: (gesture: TapGesture) => void;
  private onDoubleTap?: (gesture: TapGesture) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.attachListeners();
  }

  private attachListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
  }

  private handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      // Single touch - potential swipe or tap
      const touch = event.touches[0];
      this.startPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };
    } else if (event.touches.length === 2) {
      // Two touches - potential pinch
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.initialPinchDistance = getTouchDistance(touch1, touch2);
      event.preventDefault(); // Prevent default zoom behavior
    }
  };

  private handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2 && this.initialPinchDistance !== null) {
      // Handle pinch gesture
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);
      const pinchGesture = detectPinch(this.initialPinchDistance, currentDistance, touch1, touch2);

      if (this.onPinch) {
        this.onPinch(pinchGesture);
      }

      event.preventDefault();
    }
  };

  private handleTouchEnd = (event: TouchEvent) => {
    if (event.changedTouches.length === 1 && this.startPoint) {
      const touch = event.changedTouches[0];
      const endPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      // Check for tap
      if (isTap(this.startPoint, endPoint)) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTapTime;

        if (timeSinceLastTap < 300) {
          // Double tap
          const tapGesture: TapGesture = {
            x: endPoint.x,
            y: endPoint.y,
            count: 2,
          };

          if (this.onDoubleTap) {
            this.onDoubleTap(tapGesture);
          }
        } else {
          // Single tap
          const tapGesture: TapGesture = {
            x: endPoint.x,
            y: endPoint.y,
            count: 1,
          };

          if (this.onTap) {
            this.onTap(tapGesture);
          }
        }

        this.lastTapTime = now;
      } else {
        // Check for swipe
        const swipeGesture = detectSwipe(this.startPoint, endPoint);
        if (swipeGesture && this.onSwipe) {
          this.onSwipe(swipeGesture);
        }
      }

      this.startPoint = null;
    }

    // Reset pinch state
    if (event.touches.length < 2) {
      this.initialPinchDistance = null;
    }
  };

  private handleTouchCancel = () => {
    this.startPoint = null;
    this.initialPinchDistance = null;
  };

  // Public API to set callbacks
  public setSwipeHandler(handler: (gesture: SwipeGesture) => void) {
    this.onSwipe = handler;
  }

  public setPinchHandler(handler: (gesture: PinchGesture) => void) {
    this.onPinch = handler;
  }

  public setTapHandler(handler: (gesture: TapGesture) => void) {
    this.onTap = handler;
  }

  public setDoubleTapHandler(handler: (gesture: TapGesture) => void) {
    this.onDoubleTap = handler;
  }

  // Cleanup
  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

/**
 * Make element touch-friendly by increasing hit area
 */
export function makeTouchFriendly(element: HTMLElement, minSize: number = 44) {
  const currentWidth = element.offsetWidth;
  const currentHeight = element.offsetHeight;

  if (currentWidth < minSize || currentHeight < minSize) {
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
    element.style.display = 'inline-flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
  }
}

/**
 * Prevent default touch behaviors (like pull-to-refresh)
 */
export function preventDefaultTouch(element: HTMLElement) {
  element.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
}
