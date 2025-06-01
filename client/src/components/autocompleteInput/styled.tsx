import styled from 'styled-components';
import theme from '@/styles/theme';

export const InputContainer = styled.div`
  position: relative;
  width: 100%;
  font-family: sans-serif;
  font-size: 14px;
  border: 1px solid ${theme.colors.primary.main};
  border-radius: 4px;
  padding: 6px 12px;
  background: white;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const GhostOverlay = styled.div`
  position: absolute;
  top: 6px;
  left: 12px;
  right: 12px;
  bottom: 6px;
  font-size: 14px;
  font-family: inherit;
  color: black;
  pointer-events: none;
  white-space: pre;
  display: flex;
  align-items: center;
  z-index: 1;
  overflow-x: scroll;
  text-overflow: clip;
  -webkit-overflow-scrolling: touch;

  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari/WebKit */
  }

  .ghost {
    color: rgba(0, 0, 0, 0.3);
  }
`;

export const StyledInput = styled.input`
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  color: black;
  position: relative;
  z-index: 2;
  white-space: nowrap;
  overflow-x: scroll;
  text-overflow: clip;
  -webkit-overflow-scrolling: touch;

  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari/WebKit */
  }

  &:focus {
    outline: none;
  }
`;
