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
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: space-between;
  top: 0;
  z-index: 8888;
  background-color: ${theme.navbar.color.bg};
  transition: left 0.5s ease, width 0.5s ease;
  border: ${theme.navbar.border};
  padding: 0 20px;
  box-sizing: border-box;
`;

export const LeftSide = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  transition: flex-grow 0.5s ease;
`;

export const RightSide = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 15px;
`;

export const TabButton = styled.button<TabButtonProps>`
  background: ${({ active }) => (active ? theme.colors.primary.contrastText : 'none')};
  color: ${({ active }) => (active ? theme.colors.primary.dark : theme.colors.primary.contrastText)};
  border: none;
  height: 100%;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: unset;
  transition: color 0.3s ease, background-color 0.3s ease;

  &:hover {
    color: ${theme.colors.secondary.main};
  }

  &:focus {
    outline: none;
    border: none;
  }
`;
