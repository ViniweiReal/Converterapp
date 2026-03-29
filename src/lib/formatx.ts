// FormatX utility functions for accent colors and design system

export const ACCENT_COLORS = [
  { name: 'magenta', value: '#FF3AF2', border: '#FFE600' },
  { name: 'cyan', value: '#00F5D4', border: '#FF6B35' },
  { name: 'yellow', value: '#FFE600', border: '#FF3AF2' },
  { name: 'orange', value: '#FF6B35', border: '#7B2FFF' },
  { name: 'purple', value: '#7B2FFF', border: '#00F5D4' },
] as const;

export type AccentColor = typeof ACCENT_COLORS[number]['name'];

/**
 * Get accent color by index (rotating through the 5 colors)
 */
export function getAccentColor(index: number): typeof ACCENT_COLORS[number] {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

/**
 * Get CSS class names for accent colors
 */
export function getAccentClasses(index: number): {
  text: string;
  bg: string;
  border: string;
  card: string;
} {
  const color = getAccentColor(index);
  return {
    text: `accent-${color.name}`,
    bg: `bg-accent-${color.name}`,
    border: `border-${color.name}`,
    card: `formatx-card border-${color.name}`,
  };
}

/**
 * Get rotation class for cards (alternating rotate)
 */
export function getCardRotation(index: number): string {
  const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
  return rotations[index % rotations.length];
}

/**
 * Generate decorative elements for background
 */
export function generateDecorativeElements(): Array<{
  id: string;
  symbol: string;
  position: { top: string; left: string };
  size: number;
  animation: string;
}> {
  const symbols = ['✦', '★', '◆', '●', '✧', '✪', '✯', '✰'];
  const positions = [
    { top: '8%', left: '4%' },
    { top: '15%', left: '85%' },
    { top: '25%', left: '12%' },
    { top: '35%', left: '78%' },
    { top: '45%', left: '25%' },
    { top: '60%', left: '6%' },
    { top: '70%', left: '82%' },
    { top: '85%', left: '18%' },
  ];

  return positions.map((pos, index) => ({
    id: `decorative-${index}`,
    symbol: symbols[index % symbols.length],
    position: pos,
    size: 24 + (index % 5) * 12, // 24px to 72px
    animation: index % 4 === 0 ? 'spin' : '',
  }));
}