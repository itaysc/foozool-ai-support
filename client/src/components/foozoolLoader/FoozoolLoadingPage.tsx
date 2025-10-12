import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/system';

// Animation keyframes
const logoFloat = keyframes`
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
`;

const glow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(0, 152, 155, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(0, 152, 155, 0.8));
  }
`;

const movingLine = keyframes`
  0% {
    opacity: 0;
    width: 0;
  }
  33.3%, 66% {
    opacity: 0.8;
    width: 100%;
  }
  85% {
    width: 0;
    left: initial;
    right: 0;
    opacity: 1;
  }
  100% {
    opacity: 0;
    width: 0;
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
const PageContainer = styled(Box)({
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(0,152,155,1) 0.1%, rgba(0,94,120,1) 94.2%)',
  overflow: 'hidden',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999,
});

const LogoContainer = styled(Box)({
  position: 'relative',
  marginBottom: '40px',
  animation: `${logoFloat} 3s ease-in-out infinite, ${glow} 2s ease-in-out infinite`,
});

const LoadingTextContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center',
  padding: '0 32px',
  '&:before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '3px',
    backgroundColor: '#fff',
    bottom: '-20px',
    left: 0,
    borderRadius: '10px',
    animation: `${movingLine} 2.4s infinite ease-in-out`,
  },
});

const LoadingText = styled(Typography)({
  color: '#fff',
  fontSize: '1.2rem',
  fontWeight: 500,
  letterSpacing: '2px',
  animation: `${fadeIn} 1s ease-in-out`,
  textShadow: '0px 2px 10px rgba(0, 0, 0, 0.3)',
});

interface FoozoolLoadingPageProps {
  /** Loading text to display */
  text?: string;
  /** Logo size in pixels */
  logoSize?: number;
}

const FoozoolLoadingPage: React.FC<FoozoolLoadingPageProps> = ({
  text = 'Loading...',
  logoSize = 120,
}) => {
  return (
    <PageContainer>
      <LogoContainer>
        <img
          src="/logo/foozool_logo_transparent_bg.png"
          alt="Foozool Logo"
          style={{
            height: logoSize,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </LogoContainer>
      <LoadingTextContainer>
        <LoadingText>{text}</LoadingText>
      </LoadingTextContainer>
    </PageContainer>
  );
};

export default FoozoolLoadingPage;

