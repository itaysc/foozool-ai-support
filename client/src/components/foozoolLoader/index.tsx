import React from 'react';
import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/system';

// Animation keyframes
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const breathe = keyframes`
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
`;

const glow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(0, 152, 155, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 152, 155, 0.9));
  }
`;

// Styled components for different animation types
const PulseLogo = styled('img')({
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

const SpinLogo = styled('img')({
  animation: `${spin} 2s linear infinite`,
});

const FadeLogo = styled('img')({
  animation: `${fadeInOut} 2s ease-in-out infinite`,
});

const BounceLogo = styled('img')({
  animation: `${bounce} 1s ease-in-out infinite`,
});

const BreatheLogo = styled('img')({
  animation: `${breathe} 2.5s ease-in-out infinite`,
});

const GlowLogo = styled('img')({
  animation: `${glow} 2s ease-in-out infinite`,
});

export type AnimationType = 'pulse' | 'spin' | 'fade' | 'bounce' | 'breathe' | 'glow' | 'draw';

interface FoozoolLoaderProps {
  /** Animation type for the logo */
  animation?: AnimationType;
  /** Size of the logo in pixels */
  size?: number;
  /** Whether to show the loader */
  show?: boolean;
  /** Custom style for the container */
  containerStyle?: React.CSSProperties;
}

const FoozoolLoader: React.FC<FoozoolLoaderProps> = ({
  animation = 'pulse',
  size = 80,
  show = true,
  containerStyle,
}) => {
  if (!show) {
    return null;
  }

  const logoSrc = '/logo/foozool_logo_transparent_bg.png';
  const logoStyle = {
    height: size,
    width: 'auto',
    objectFit: 'contain' as const,
  };

  const getAnimatedLogo = () => {
    switch (animation) {
      case 'spin':
        return <SpinLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
      case 'fade':
        return <FadeLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
      case 'bounce':
        return <BounceLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
      case 'breathe':
        return <BreatheLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
      case 'glow':
        return <GlowLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
      case 'pulse':
      default:
        return <PulseLogo src={logoSrc} alt="Loading..." style={logoStyle} />;
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      style={containerStyle}
    >
      {getAnimatedLogo()}
    </Box>
  );
};

export default FoozoolLoader;

// Named exports for additional components
export { default as FoozoolLoadingPage } from './FoozoolLoadingPage';
export { default as FoozoolOverlayLoader } from './FoozoolOverlayLoader';

