import CloseIcon_ from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import theme from '@/styles/theme';
import styled, { keyframes } from "styled-components";

export const Overlay = styled.div`
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${theme.colors.primary.main};
  color: #fff;
//   padding: 10px;
  transition: all 0.3s ease;
`;

export const Content = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  padding: 40px 10px 10px 10px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),0 1px 2px 0 rgba(0, 0, 0, 0.06);
`;

export const BotIcon = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: ${theme.colors.primary.main};
  color: #fff;
`;

export const ChatContainer = styled.div`
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  .open {
    width: 350px;
    height: 400px;
    border-radius: 5px;
    background-color: ${theme.colors.primary.contrastText};
    // border: 1px solid ${theme.colors.grey[300]};
    opacity: 1;
  }
  .content-open {
    opacity: 1;
    width: 100%;
    height: 100%;
  }
  .content-close {
    opacity: 0;
    width: 0px;
    height: 0px;
    padding: 0px;
  }
  .loader-open {
    display: block;
  }
  .loader-close {
    display: none;
  }
`;

export const CloseBtn = styled(IconButton)`
    position: absolute !important;
    right: 0;
    top: 0;
`;

export const CloseIcon = styled(CloseIcon_)`
    color: ${theme.colors.primary.main};
    font-size: 20px;
`;

export const LoaderContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    width: 100%;
    margin-top: 15px;
`;

export const AnswerContainer = styled.div`
    margin-top: 15px;
    display: flex;
    justify-content: flex-start;
    width: 100%;
`;

export const AnswerText = styled.div`
    font-size: 14px;
    font-weight: 400;
    color: ${theme.colors.text.dark};
`;

export const InstructionsText = styled.p`
    font-size: 14px;
    font-weight: 400;
    color: ${theme.colors.text.dark};
`;

export const InstructionsTextWrapper = styled.div`
    margin-top: 10px;
`;

export const InstructionKeyword = styled.span`
  font-weight: 500;
  color: ${theme.colors.text.dark};
  border-radius: 20px;
  background-color: ${theme.colors.primary.lightRgba};
  padding: 1px 5px;
  margin: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const ChatNavigationButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  margin-top: 15px;
  gap: 10px;
`;


export const ChatNavigationButton = styled.button`
  background-color: ${theme.colors.primary.main};
  color: ${theme.colors.primary.contrastText};
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  &:hover {
    background-color: ${theme.colors.primary.dark};
  }
`;
