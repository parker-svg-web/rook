import React from 'react';

interface Props {
  size?: number;
  color?: string;
}

export default function RookLogo({ size = 32, color = '#000000' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3L7 6H9V3H11V6H13V3H15V6H17V3H19V8C19 9.5 18 10.5 17 11V15L19 21H5L7 15V11C6 10.5 5 9.5 5 8V3H7Z" 
        fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"/>
    </svg>
  );
}
