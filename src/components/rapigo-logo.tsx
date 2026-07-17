'use client';

import Image from 'next/image';

interface RapigoLogoProps {
  /** Height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Use transparent version (no background) */
  transparent?: boolean;
  /** Force specific variant: 'light' | 'dark' | 'auto' */
  variant?: 'light' | 'dark' | 'auto';
  /** Alt text */
  alt?: string;
  /** Priority loading */
  priority?: boolean;
}

/**
 * RapigoLogo - Composant officiel du logo Rapigo Mali
 *
 * Gère automatiquement le mode sombre/clair via CSS :
 * - Mode clair : logo avec couleurs d'origine
 * - Mode sombre : logo blanc sur fond transparent
 */
export function RapigoLogo({
  height = 36,
  className = '',
  transparent = true,
  variant = 'auto',
  alt = 'Rapigo Mali',
  priority = false,
}: RapigoLogoProps) {
  // Calculate width from aspect ratio (1536x1024 = 1.5:1)
  const width = Math.round(height * 1.5);

  const lightSrc = transparent ? '/logo-transparent.png' : '/logo.png';
  const darkSrc = '/logo-white.png';

  if (variant === 'dark') {
    // Force dark mode variant (white logo)
    return (
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        className={`object-contain ${className}`}
        priority={priority}
      />
    );
  }

  if (variant === 'light') {
    // Force light mode variant (colored logo)
    return (
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        className={`object-contain ${className}`}
        priority={priority}
      />
    );
  }

  // Auto mode: use CSS dark: to switch between versions
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        className="object-contain dark:hidden"
        priority={priority}
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        className="object-contain hidden dark:block"
        priority={priority}
      />
    </div>
  );
}

/**
 * RapigoLogoIcon - Version icône carrée du logo (pour favicons contextuelles)
 */
export function RapigoLogoIcon({
  size = 40,
  className = '',
  alt = 'Rapigo Mali',
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/logo-transparent.png"
        alt={alt}
        width={size}
        height={size}
        className="object-contain rounded-lg dark:hidden"
      />
      <Image
        src="/logo-white.png"
        alt={alt}
        width={size}
        height={size}
        className="object-contain rounded-lg hidden dark:block"
      />
    </div>
  );
}