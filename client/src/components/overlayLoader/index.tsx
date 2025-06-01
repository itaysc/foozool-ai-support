// components/FullScreenLoaderOverlay/FullScreenLoaderOverlay.tsx
import React from 'react';
import { CircularProgress } from '@mui/material';
import { OverlayWrapper, SpinnerContainer } from './styled';

type FullScreenLoaderOverlayProps = {
  loading: boolean;
};

const OverlayLoader: React.FC<FullScreenLoaderOverlayProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <OverlayWrapper>
      <SpinnerContainer>
        <CircularProgress size={60} />
      </SpinnerContainer>
    </OverlayWrapper>
  );
};

export default OverlayLoader;
