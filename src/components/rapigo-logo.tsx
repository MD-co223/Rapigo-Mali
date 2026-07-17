'use client';

import Image from 'next/image';

interface RapigoLogoProps {
  variant: 'horizontal' | 'vertical' | 'icon' | 'white' | 'transparent';
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

const VARIANT_SRC: Record<RapigoLogoProps['variant'], string> = {
  horizontal: '/logo-horizontal.png',
  vertical: '/logo-vertical.png',
  icon: '/logo-icon.png',
  white: '/logo-white.png',
  transparent: '/logo-transparent.png',
};

/** Aspect ratios derived from actual PNG dimensions */
const VARIANT_RATIO: Record<RapigoLogoProps['variant'], number> = {
  horizontal: 1316 / 73,
  vertical: 1150 / 107,
  icon: 224 / 56,
  white: 1387 / 90,
  transparent: 1316 / 73,
};

export function RapigoLogo({
  variant,
  height = 36,
  className = '',
  alt = 'Rapigo Mali',
  priority = false,
}: RapigoLogoProps) {
  const width = Math.round(height * VARIANT_RATIO[variant]);

  return (
    <Image
      src={VARIANT_SRC[variant]}
      alt={alt}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      unoptimized
      priority={priority}
    />
  );
}