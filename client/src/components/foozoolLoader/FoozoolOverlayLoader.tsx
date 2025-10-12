import React from 'react';
import { Box, Typography } from '@mui/material';
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

const glow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(0, 152, 155, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 25px rgba(0, 152, 155, 0.9));
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Styled components
const OverlayWrapper = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(4px)',
  animation: `${fadeIn} 0.3s ease-in-out`,
});

const LoaderContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '16px',
  padding: '40px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
});

const LogoContainer = styled(Box)({
  animation: `${pulse} 1.5s ease-in-out infinite, ${glow} 2s ease-in-out infinite`,
  marginBottom: '20px',
});

const LoadingText = styled(Typography)({
  color: '#333',
  fontSize: '1rem',
  fontWeight: 500,
  marginTop: '16px',
  animation: `${fadeIn} 1s ease-in-out`,
});

interface FoozoolOverlayLoaderProps {
  /** Whether to show the loader */
  loading: boolean;
  /** Loading text to display */
  text?: string;
  /** Logo size in pixels */
  logoSize?: number;
}

const FoozoolOverlayLoader: React.FC<FoozoolOverlayLoaderProps> = ({
  loading,
  text = 'Loading...',
  logoSize = 80,
}) => {
  if (!loading) {
    return null;
  }

  return (
    <OverlayWrapper>
      <LoaderContainer>
        <LogoContainer>
          <img
            src="/logo/foozool_logo_transparent_bg.png"
            alt="Loading..."
            style={{
              height: logoSize,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </LogoContainer>
        {text && <LoadingText>{text}</LoadingText>}
      </LoaderContainer>
    </OverlayWrapper>
  );
};

export default FoozoolOverlayLoader;

