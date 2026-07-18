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

export function RapigoLogo({
  variant,
  height = 36,
  className = '',
  alt = 'Rapigo Mali',
  priority = false,
}: RapigoLogoProps) {
  return (
    <div
      style={{ height, maxHeight: height, minHeight: height }}
      className={`relative overflow-visible flex-shrink-0 ${className}`}
    >
      <Image
        src={VARIANT_SRC[variant]}
        alt={alt}
        fill
        sizes={`${height * 5}px`}
        className="!relative !h-full !w-auto object-contain object-left"
        unoptimized
        priority={priority}
      />
    </div>
  );
}