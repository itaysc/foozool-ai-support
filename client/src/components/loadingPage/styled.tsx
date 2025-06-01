import styled, { keyframes } from 'styled-components';

export const movingLine = keyframes`
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

export const moveLetters = keyframes`
  0% {
    transform: translateX(-15vw);
    opacity: 0;
  }
  33.3%, 66% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(15vw);
    opacity: 0;
  }
`;

// Styled components
export const Body = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: radial-gradient(circle farthest-corner at 10% 20%, rgba(0,152,155,1) 0.1%, rgba(0,94,120,1) 94.2%);
  background-size: 100%;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
`;

export const LoadingContainer = styled.div`
  width: 100%;
  max-width: 520px;
  text-align: center;
  color: #fff;
  position: relative;
  margin: 0 32px;

  &:before {
    content: '';
    position: absolute;
    width: 100%;
    height: 3px;
    background-color: #fff;
    bottom: 0;
    left: 0;
    border-radius: 10px;
    animation: ${movingLine} 2.4s infinite ease-in-out;
  }
`;

export const LoadingText = styled.div`
  font-size: 5vw;
  line-height: 64px;
  letter-spacing: 10px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-evenly;

  span {
    animation: ${moveLetters} 2.4s infinite ease-in-out;
    transform: translatex(0);
    position: relative;
    display: inline-block;
    opacity: 0;
    text-shadow: 0px 2px 10px rgba(46, 74, 81, 0.3);

    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.4s; }
    &:nth-child(5) { animation-delay: 0.5s; }
    &:nth-child(6) { animation-delay: 0.6s; }
    &:nth-child(7) { animation-delay: 0.7s; }
  }
`;

export const Socials = styled.div`
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
`;

export const SocialLink = styled.a`
  color: #fff;
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  margin-right: 12px;
`;