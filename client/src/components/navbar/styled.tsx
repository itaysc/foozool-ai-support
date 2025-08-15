import styled from 'styled-components';
import theme from '@/styles/theme';

interface ContainerProps {
  drawerOpen: boolean;
}

interface TabButtonProps {
  active?: boolean;
}

export const Container = styled.div<ContainerProps>`
  width: 100vw;
  height: ${theme.navbar.height};
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  top: 0;
  left: 0;
  z-index: 1000;
  background: linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${theme.colors.primary.dark} 100%);
  box-shadow: ${theme.shadows.lg};
  padding: 0 24px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ${theme.transitions.easing.easeInOut};
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: 0 16px;
  }
  
  @media (max-width: ${theme.breakpoints.sm}) {
    padding: 0 12px;
  }
`;

export const LeftSide = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  transition: flex-grow 0.5s ease;
  
  img {
    filter: brightness(0) invert(1);
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    gap: 1rem;
  }
  
  @media (max-width: ${theme.breakpoints.sm}) {
    gap: 0.5rem;
  }
`;

export const RightSide = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 8px;
  position: relative;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    gap: 4px;
  }
`;

export const TabButton = styled.button<TabButtonProps>`
  background: ${({ active }) => 
    active 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'transparent'
  };
  color: ${({ active }) => 
    active 
      ? theme.colors.primary.contrastText 
      : 'rgba(255, 255, 255, 0.9)'
  };
  border: none;
  height: 40px;
  padding: 0 16px;
  font-size: 0.9rem;
  font-weight: ${({ active }) => active ? '600' : '500'};
  cursor: pointer;
  border-radius: ${theme.borderRadius.base};
  transition: all 0.2s ${theme.transitions.easing.easeInOut};
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: 0.025em;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${({ active }) => 
      active 
        ? 'rgba(255, 255, 255, 0.25)' 
        : 'rgba(255, 255, 255, 0.1)'
    };
    color: theme.colors.primary.contrastText;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: 0 12px;
    font-size: 0.85rem;
  }
  
  @media (max-width: ${theme.breakpoints.sm}) {
    display: none;
  }
`;
