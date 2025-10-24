import styled from 'styled-components';
import theme from '@/styles/theme';

// Dark theme colors for landing page only - scoped to this component
const landingPageColors = {
  background: {
    default: '#0a0a0a',
    paper: '#1a1a1a',
    dark: '#000000',
    light: '#2a2a2a'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    disabled: '#71717a',
    hint: '#52525b',
    light: '#f4f4f5'
  },
  primary: theme.colors.primary
};

export const LandingPageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${landingPageColors.background.default} 0%, ${landingPageColors.background.paper} 100%);
  color: ${landingPageColors.text.primary};
  position: relative;
  overflow-x: hidden;
  
  /* Subtle background pattern */
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(25, 118, 210, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  /* Override global styles only within this container */
  * {
    box-sizing: border-box;
  }
  
  /* Ensure content is above background */
  > * {
    position: relative;
    z-index: 1;
  }
`;

export const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0;
`;

export const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

export const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${landingPageColors.primary.main};
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const NavLink = styled.a`
  color: ${landingPageColors.text.secondary};
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;

  &:hover {
    color: ${landingPageColors.primary.main};
  }
`;

export const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${landingPageColors.text.primary};
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const MobileMenu = styled.div<{ isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  background: rgba(10, 10, 10, 0.98);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  z-index: 999;
  transform: translateY(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const MobileNavLink = styled.a`
  display: block;
  color: ${landingPageColors.text.secondary};
  text-decoration: none;
  padding: 0.75rem 0;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    color: ${landingPageColors.primary.main};
  }
`;

export const HeroSection = styled.section`
  padding: 8rem 0 4rem;
  text-align: center;
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
  position: relative;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  /* Background gradient overlay */
  background: 
    linear-gradient(
      135deg,
      rgba(10, 10, 10, 0.8) 0%,
      rgba(10, 10, 10, 0.7) 50%,
      rgba(10, 10, 10, 0.9) 100%
    );
  
  /* Add opacity to the background image */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/images/insight.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.3;
    z-index: -1;
  }
  border-radius: 0;
  margin: 0;
  backdrop-filter: blur(20px);
  border: none;
  overflow: hidden;
  
  /* Animated background elements */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: 
      radial-gradient(circle at 20% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(25, 118, 210, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 60%, rgba(25, 118, 210, 0.06) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }
`;

export const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
`;

export const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const HeroSubtitle = styled.p`
  font-size: clamp(1.1rem, 2vw, 1.25rem);
  color: ${landingPageColors.text.secondary};
  max-width: 600px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

export const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
`;

export const FeaturesSection = styled.section`
  padding: 6rem 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: ${landingPageColors.text.primary};
`;

export const SectionSubtitle = styled.p`
  font-size: 1.1rem;
  color: ${landingPageColors.text.secondary};
  text-align: center;
  max-width: 600px;
  margin: 0 auto 3rem;
  line-height: 1.6;
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

export const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2.5rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  /* Subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(25, 118, 210, 0.05) 0%,
      transparent 50%,
      rgba(25, 118, 210, 0.02) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: ${landingPageColors.primary.main};
    box-shadow: 
      0 20px 40px rgba(25, 118, 210, 0.15),
      0 0 0 1px rgba(25, 118, 210, 0.2);
    
    &::before {
      opacity: 1;
    }
  }
`;

export const FeatureIcon = styled.div`
  width: 90px;
  height: 90px;
  background: transparent;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  color: transparent;
  background-image: linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  
  &:hover {
    background-image: linear-gradient(135deg, #4b5563 0%, #6b7280 50%, #9ca3af 100%);
    transform: scale(1.05);
    transition: all 0.3s ease;
  }
`;

export const ColoredFeatureIcon = styled.div<{ color?: string }>`
  width: 90px;
  height: 90px;
  background: transparent;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  color: ${props => props.color || '#6b7280'};
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  
  &:hover {
    transform: scale(1.05);
    transition: all 0.3s ease;
  }
`;

export const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${landingPageColors.text.primary};
`;

export const FeatureDescription = styled.p`
  color: ${landingPageColors.text.secondary};
  line-height: 1.6;
`;

export const SolutionsSection = styled.section`
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const SolutionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

export const SolutionCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.4s ease;
  position: relative;
  backdrop-filter: blur(10px);
  
  /* Subtle border gradient */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    padding: 1px;
    background: linear-gradient(135deg, transparent, rgba(25, 118, 210, 0.3), transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: ${landingPageColors.primary.main};
    transform: translateY(-4px);
    box-shadow: 0 15px 30px rgba(25, 118, 210, 0.1);
    
    &::before {
      opacity: 1;
    }
  }
`;

export const SolutionTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${landingPageColors.text.primary};
`;

export const SolutionDescription = styled.p`
  color: ${landingPageColors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

export const CTASection = styled.section`
  padding: 6rem 0;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

export const ContactSection = styled.section`
  padding: 6rem 0;
  background: linear-gradient(
    135deg,
    rgba(25, 118, 210, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(25, 118, 210, 0.05) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  
  /* Subtle pattern overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(25, 118, 210, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
`;

export const ContactForm = styled.form`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${landingPageColors.text.primary};
  font-weight: 500;
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: ${landingPageColors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: ${landingPageColors.primary.main};
    box-shadow: 
      0 0 0 2px rgba(25, 118, 210, 0.2),
      0 8px 20px rgba(25, 118, 210, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: ${landingPageColors.text.secondary};
  }
`;

export const FormTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: ${landingPageColors.text.primary};
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: ${landingPageColors.primary.main};
    box-shadow: 
      0 0 0 2px rgba(25, 118, 210, 0.2),
      0 8px 20px rgba(25, 118, 210, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: ${landingPageColors.text.secondary};
  }
`;

export const Footer = styled.footer`
  padding: 3rem 0;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: ${landingPageColors.text.secondary};
`;
