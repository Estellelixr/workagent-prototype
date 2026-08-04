import React from 'react';

type PrototypeIconProps = {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
};

export default function PrototypeIcon({ name, size = 28, className = '', alt = '' }: PrototypeIconProps) {
  return (
    <img
      src={`/prototype-icons-svg/icons/${name}.svg`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
