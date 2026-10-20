import React from 'react';

interface MascotProps {
  className?: string;
  width?: number;
  height?: number;
}

export const MascotRex: React.FC<MascotProps> = ({
  className = '',
  width = 48,
  height = 36,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M30 0H46V2H30V0Z" fill="#0B2A9E" />
      <path d="M28 2H48V4H28V2Z" fill="#0B2A9E" />
      <path d="M28 4H48V6H28V4Z" fill="#0B2A9E" />
      <path d="M28 6H48V8H28V6Z" fill="#0B2A9E" />
      <path d="M28 8H48V10H28V8Z" fill="#0B2A9E" />
      <path d="M28 10H48V12H28V10Z" fill="#0B2A9E" />
      <path d="M28 12H40V14H28V12Z" fill="#0B2A9E" />
      <path d="M28 14H38V16H28V14Z" fill="#0B2A9E" />
      <path d="M26 16H40V18H26V16Z" fill="#0B2A9E" />
      <path d="M16 18H40V20H16V18Z" fill="#0B2A9E" />
      <path d="M42 18H48V20H42V18Z" fill="#0B2A9E" />
      <path d="M0 20H6V22H0V20Z" fill="#0B2A9E" />
      <path d="M10 20H40V22H10V20Z" fill="#0B2A9E" />
      <path d="M0 22H38V24H0V22Z" fill="#0B2A9E" />
      <path d="M4 24H38V26H4V24Z" fill="#0B2A9E" />
      <path d="M8 26H36V28H8V26Z" fill="#0B2A9E" />
      <path d="M12 28H36V30H12V28Z" fill="#0B2A9E" />
      <path d="M16 30H24V32H16V30Z" fill="#0B2A9E" />
      <path d="M28 30H36V32H28V30Z" fill="#0B2A9E" />
      <path d="M16 32H24V34H16V32Z" fill="#0B2A9E" />
      <path d="M28 32H36V34H28V32Z" fill="#0B2A9E" />
      <path d="M16 34H26V36H16V34Z" fill="#0B2A9E" />
      <path d="M28 34H38V36H28V34Z" fill="#0B2A9E" />
      <path d="M22 22H34V24H22V22Z" fill="#C6FF3D" />
      <path d="M22 24H34V26H22V24Z" fill="#C6FF3D" />
      <path d="M22 26H34V28H22V26Z" fill="#C6FF3D" />
      <rect x="36" y="4" width="2" height="2" fill="#FFFBF1" />
    </svg>
  );
};
