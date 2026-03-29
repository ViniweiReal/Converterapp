// Apple-inspired micro-interactions and haptic feedback

export const useHapticFeedback = () => {
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    // For devices that support haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[intensity]);
    }

    // CSS haptic feedback simulation
    if (typeof document !== 'undefined') {
      const hapticElement = document.createElement('div');
      hapticElement.style.cssText = `
        position: fixed;
        top: -100px;
        left: -100px;
        width: 1px;
        height: 1px;
        pointer-events: none;
        animation: haptic-${intensity} 0.1s ease-out;
      `;
      document.body.appendChild(hapticElement);

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes haptic-light {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes haptic-medium {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes haptic-heavy {
          0% { transform: scale(1); }
          25% { transform: scale(1.08); }
          50% { transform: scale(0.98); }
          75% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);

      setTimeout(() => {
        document.body.removeChild(hapticElement);
        document.head.removeChild(style);
      }, 100);
    }
  };

  return { triggerHaptic };
};