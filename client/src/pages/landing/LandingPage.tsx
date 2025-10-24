import React, { useState } from 'react';
import { Button, Container, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import theme from '@/styles/theme';
import * as styled from './styled';
import leadsService from '@/services/leads-service';

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



const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const handleBookDemo = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await leadsService.create(formData);
      setSubmitMessage('Thank you! We\'ll be in touch soon to schedule your demo.');
      setFormData({ name: '', email: '', company: '', message: '' });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setSubmitMessage('A lead with this email already exists. We\'ll be in touch soon!');
      } else {
        setSubmitMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLogin = () => {
    navigate('/login');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <styled.LandingPageContainer>
      <styled.Header>
        <styled.Nav>
          <styled.Logo>TKTAI</styled.Logo>
          <styled.NavLinks>
            <styled.NavLink href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</styled.NavLink>
            <styled.NavLink href="#solutions" onClick={(e) => handleNavClick(e, 'solutions')}>Solutions</styled.NavLink>
            <styled.NavLink href="#about" onClick={(e) => handleNavClick(e, 'about')}>About</styled.NavLink>
            <Button
              variant="outlined"
              onClick={handleLogin}
              sx={{
                color: landingPageColors.primary.main,
                borderColor: landingPageColors.primary.main,
                '&:hover': {
                  borderColor: landingPageColors.primary.light,
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Login
            </Button>
          </styled.NavLinks>
          <styled.MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </styled.MobileMenuButton>
        </styled.Nav>
        <styled.MobileMenu isOpen={mobileMenuOpen}>
          <styled.MobileNavLink href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</styled.MobileNavLink>
          <styled.MobileNavLink href="#solutions" onClick={(e) => handleNavClick(e, 'solutions')}>Solutions</styled.MobileNavLink>
          <styled.MobileNavLink href="#about" onClick={(e) => handleNavClick(e, 'about')}>About</styled.MobileNavLink>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleLogin}
              sx={{
                color: landingPageColors.primary.main,
                borderColor: landingPageColors.primary.main,
                '&:hover': {
                  borderColor: landingPageColors.primary.light,
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Login
            </Button>
          </Box>
        </styled.MobileMenu>
      </styled.Header>

      <styled.HeroSection>
        <styled.HeroContent>
          <styled.HeroTitle>
            Turn your data into strategic decisions with insightful AI
          </styled.HeroTitle>
          <styled.HeroSubtitle>
            Transform your operations with AI that analyzes data, generates insights, 
            and provides intelligent & actionable recommendations that will boost your team's performance and time consumption.
          </styled.HeroSubtitle>
          <styled.CTAButtons>
            <Button
              variant="contained"
              size="large"
              onClick={handleBookDemo}
              sx={{
                backgroundColor: landingPageColors.primary.main,
                color: landingPageColors.primary.contrastText,
                padding: '12px 32px',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: landingPageColors.primary.dark,
                },
              }}
            >
              Book Demo
            </Button>
          </styled.CTAButtons>
        </styled.HeroContent>
      </styled.HeroSection>


      <styled.FeaturesSection id="features">
        <styled.SectionTitle>Why choose TKTAI?</styled.SectionTitle>
        <styled.SectionSubtitle>
          Generic AI falls short where precision matters. Our platform understands complex workflows, 
          parses unstructured data, and delivers insights that drive real business value.
        </styled.SectionSubtitle>
        
        <styled.FeaturesGrid>
          <styled.FeatureCard>
            <styled.FeatureIcon>🤖</styled.FeatureIcon>
            <styled.FeatureTitle>Intelligent Data Analysis</styled.FeatureTitle>
            <styled.FeatureDescription>
              Smart data analysis with intelligent recommendations and insights 
              based on priority levels and confidence scores.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>📊</styled.FeatureIcon>
            <styled.FeatureTitle>50+ AI Insights</styled.FeatureTitle>
            <styled.FeatureDescription>
              Business intelligence scoring, trend prediction, sentiment analysis, growth opportunities, 
              and stakeholder analysis across all data sources.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>📁</styled.FeatureIcon>
            <styled.FeatureTitle>Document Intelligence</styled.FeatureTitle>
            <styled.FeatureDescription>
              AI document analysis with automatic classification, sentiment analysis, 
              topic extraction, and seamless cloud integration.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>🎫</styled.FeatureIcon>
            <styled.FeatureTitle>System Integration</styled.FeatureTitle>
            <styled.FeatureDescription>
              Multi-platform support with unified interface, real-time sync, 
              and complete data visibility across all your tools.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>🔍</styled.FeatureIcon>
            <styled.FeatureTitle>Advanced Search</styled.FeatureTitle>
            <styled.FeatureDescription>
              Vector search across data, documents, and files using semantic understanding 
              with context-aware results and relevance scoring.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>⚡</styled.FeatureIcon>
            <styled.FeatureTitle>Real-time Processing</styled.FeatureTitle>
            <styled.FeatureDescription>
              Webhook integration, background jobs, and live analytics for instant processing 
              of data, documents, and business interactions.
            </styled.FeatureDescription>
          </styled.FeatureCard>
        </styled.FeaturesGrid>
      </styled.FeaturesSection>

      <styled.SolutionsSection id="solutions">
        <styled.SectionTitle>Built for your unique workflows</styled.SectionTitle>
        <styled.SectionSubtitle>
          Use our ready-to-go solutions that generate immediate impact, or fully customize 
          our tools to fit your team's specific needs.
        </styled.SectionSubtitle>
        
        <styled.SolutionsGrid>
          <styled.SolutionCard>
            <styled.SolutionTitle>Business Intelligence Teams</styled.SolutionTitle>
            <styled.SolutionDescription>
              Proactive risk detection, data intelligence, stakeholder mapping, and automated insights.
            </styled.SolutionDescription>
          </styled.SolutionCard>

          <styled.SolutionCard>
            <styled.SolutionTitle>Operations Teams</styled.SolutionTitle>
            <styled.SolutionDescription>
              Autonomous operations, smart escalation, pattern recognition, and performance monitoring.
            </styled.SolutionDescription>
          </styled.SolutionCard>

          <styled.SolutionCard>
            <styled.SolutionTitle>Growth Teams</styled.SolutionTitle>
            <styled.SolutionDescription>
              Expansion opportunities, business intelligence, strategic preparation, and opportunity tracking.
            </styled.SolutionDescription>
          </styled.SolutionCard>

          <styled.SolutionCard>
            <styled.SolutionTitle>Enterprise IT</styled.SolutionTitle>
            <styled.SolutionDescription>
              Robust APIs, clean documentation, secure infrastructure that fits with your existing stack.
            </styled.SolutionDescription>
          </styled.SolutionCard>
        </styled.SolutionsGrid>
      </styled.SolutionsSection>

      <styled.FeaturesSection id="about">
        <styled.SectionTitle>About TKTAI</styled.SectionTitle>
        <styled.SectionSubtitle>
          We've created a proprietary AI architecture that uniquely replicates human business reasoning 
          and has overcome challenges traditionally faced by AI systems to give actionable insights at scale.
        </styled.SectionSubtitle>
        
        <styled.FeaturesGrid>
          <styled.FeatureCard>
            <styled.FeatureIcon>🎯</styled.FeatureIcon>
            <styled.FeatureTitle>Business Native</styled.FeatureTitle>
            <styled.FeatureDescription>
              Our platform understands complicated business processes, parses unstructured documentation, 
              and speaks business like an industry expert (because it's built by experts).
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>🔧</styled.FeatureIcon>
            <styled.FeatureTitle>Versatile Application</styled.FeatureTitle>
            <styled.FeatureDescription>
              Use our ready-to-go workflows that generate immediate impact, or fully customize our tools 
              to fit your needs. Custom flows, easily operationalized.
            </styled.FeatureDescription>
          </styled.FeatureCard>

          <styled.FeatureCard>
            <styled.FeatureIcon>🤝</styled.FeatureIcon>
            <styled.FeatureTitle>Flexible Deployment</styled.FeatureTitle>
            <styled.FeatureDescription>
              Built with enterprise IT in mind—with robust APIs, clean documentation, and secure infrastructure 
              that fits with your existing stack. You stay in control, we help you move faster.
            </styled.FeatureDescription>
          </styled.FeatureCard>
        </styled.FeaturesGrid>
      </styled.FeaturesSection>

      <styled.CTASection>
        <styled.SectionTitle>Ready to transform your operations?</styled.SectionTitle>
        <styled.SectionSubtitle>
          Generate actionable insights, analyze complex data, 
          and drive data-driven decisions with TKTAI.
        </styled.SectionSubtitle>
        <styled.CTAButtons>
          <Button
            variant="contained"
            size="large"
            onClick={handleBookDemo}
            sx={{
              backgroundColor: landingPageColors.primary.main,
              color: landingPageColors.primary.contrastText,
              padding: '16px 40px',
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: landingPageColors.primary.dark,
              },
            }}
          >
            Book a Demo
          </Button>
        </styled.CTAButtons>
      </styled.CTASection>

      <styled.ContactSection id="contact">
        <styled.SectionTitle>Book a Demo</styled.SectionTitle>
        
        <styled.ContactForm onSubmit={handleSubmit}>
          <styled.FormGroup>
            <styled.FormLabel htmlFor="name">Full Name *</styled.FormLabel>
            <styled.FormInput
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </styled.FormGroup>
          
          <styled.FormGroup>
            <styled.FormLabel htmlFor="email">Email Address *</styled.FormLabel>
            <styled.FormInput
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
            />
          </styled.FormGroup>
          
          <styled.FormGroup>
            <styled.FormLabel htmlFor="company">Company</styled.FormLabel>
            <styled.FormInput
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Enter your company name"
            />
          </styled.FormGroup>
          
          <styled.FormGroup>
            <styled.FormLabel htmlFor="message">Message</styled.FormLabel>
            <styled.FormTextarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us about your needs and how we can help..."
            />
          </styled.FormGroup>
          
          <Button
            variant="contained"
            size="large"
            disabled={isSubmitting}
            onClick={handleSubmit}
            sx={{
              backgroundColor: landingPageColors.primary.main,
              color: landingPageColors.primary.contrastText,
              padding: '16px 40px',
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: '8px',
              width: '100%',
              '&:hover': {
                backgroundColor: landingPageColors.primary.dark,
              },
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          
          {submitMessage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: submitMessage.includes('Thank you') ? landingPageColors.primary.main : '#ef4444',
                  fontWeight: 500 
                }}
              >
                {submitMessage}
              </Typography>
            </Box>
          )}
        </styled.ContactForm>
      </styled.ContactSection>

      <styled.Footer>
        <Container maxWidth="lg">
          <Box sx={{ mb: 2 }}>
            <styled.Logo>TKTAI</styled.Logo>
          </Box>
          <Typography variant="body2" color="text.secondary">
            © 2024 TKTAI. All rights reserved.
          </Typography>
        </Container>
      </styled.Footer>
    </styled.LandingPageContainer>
  );
};

export default LandingPage;
