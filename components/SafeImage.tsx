'use client';

import React, { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';

const FALLBACK_IMAGE_DATA_URI =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"%3E%3Crect width="600" height="800" fill="%23eef2f7"/%3E%3Ccircle cx="300" cy="280" r="88" fill="%23cbd5e1"/%3E%3Cpath d="M138 640c35-116 127-178 162-178s127 62 162 178" fill="%23cbd5e1"/%3E%3Ctext x="300" y="726" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="%2364748b"%3EBilde mangler%3C/text%3E%3C/svg%3E';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string;
};

export default function SafeImage({ src, alt, onError, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(event) => {
        if (currentSrc !== FALLBACK_IMAGE_DATA_URI) {
          setCurrentSrc(FALLBACK_IMAGE_DATA_URI);
        }
        onError?.(event);
      }}
    />
  );
}