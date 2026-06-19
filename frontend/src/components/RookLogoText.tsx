import React from 'react';
import RookLogo from './RookLogo';

interface Props {
  size?: number;
}

export default function RookLogoText({ size = 24 }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <RookLogo size={size} color="#ffffff" />
      <span style={{ fontSize: size * 0.9, fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>Rook</span>
    </div>
  );
}
