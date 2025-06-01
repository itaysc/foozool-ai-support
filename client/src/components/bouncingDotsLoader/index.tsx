import React from 'react';
import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/system';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  } 
  40% {
    transform: scale(1);
  }
`;

const Dot = styled('div')(({ theme }) => ({
  width: 8,
  height: 8,
  margin: '0 4px',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  display: 'inline-block',
  animation: `${bounce} 1.4s infinite ease-in-out both`,
}));

const Dot1 = styled(Dot)({
  animationDelay: '0s',
});
const Dot2 = styled(Dot)({
  animationDelay: '0.2s',
});
const Dot3 = styled(Dot)({
  animationDelay: '0.4s',
});

interface BouncingDotsLoaderProps {
  color?: string;
  show?: boolean;
}

const BouncingDotsLoader = ({ color = '#000', show = true }: BouncingDotsLoaderProps) => {
    if (!show) {
        return null;
    }
    return (
        <Box display="flex" >
            <Dot1 color={color} />
            <Dot2 color={color} />
            <Dot3 color={color} />
        </Box>
    );
};

export default BouncingDotsLoader;