/**
 * FoozoolLoader Examples
 * 
 * This file demonstrates all the different loader components and their variations.
 * You can use this as a reference or create a demo page to showcase the loaders.
 */

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import FoozoolLoader, { AnimationType } from './index';
import FoozoolLoadingPage from './FoozoolLoadingPage';
import FoozoolOverlayLoader from './FoozoolOverlayLoader';

const FoozoolLoaderExamples: React.FC = () => {
  const [showFullPage, setShowFullPage] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const animations: AnimationType[] = ['pulse', 'spin', 'fade', 'bounce', 'breathe', 'glow'];

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        Foozool Loader Components
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        A collection of animated loader components using the Foozool logo.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Basic Inline Loaders */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          1. Basic Inline Loaders
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Different animation types for the FoozoolLoader component.
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 3,
          mt: 3 
        }}>
          {animations.map((animation) => (
            <Paper key={animation} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {animation}
              </Typography>
              <FoozoolLoader animation={animation} size={80} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                animation="{animation}"
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Size Variations */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          2. Size Variations
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The same animation with different sizes.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[40, 60, 80, 100, 120].map((size) => (
              <Box key={size} sx={{ textAlign: 'center' }}>
                <FoozoolLoader animation="pulse" size={size} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {size}px
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Draw Animation Special Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          3. Drawing Animation (Special)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Simulates the logo being drawn with a pencil. Includes animated pencil and drawing line.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" gutterBottom fontWeight={600}>
                With Pencil (looping)
              </Typography>
              <FoozoolLoader animation="draw" size={100} />
            </Box>
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Overlay Loader */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          4. Overlay Loader
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          A centered overlay loader that appears on top of existing content.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowOverlay(true);
              setTimeout(() => setShowOverlay(false), 3000);
            }}
          >
            Show Overlay Loader (3 seconds)
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Click to see the overlay loader
          </Typography>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Full Page Loader */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          4. Full Page Loader
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          A full-screen loading page with gradient background.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowFullPage(true);
              setTimeout(() => setShowFullPage(false), 3000);
            }}
          >
            Show Full Page Loader (3 seconds)
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Click to see the full page loader
          </Typography>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Usage Examples */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          5. Code Examples
        </Typography>
        
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Basic Inline Loader
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {`<FoozoolLoader animation="pulse" size={80} />`}
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overlay Loader
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {`<FoozoolOverlayLoader 
  loading={isLoading} 
  text="Saving changes..." 
/>`}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Full Page Loader
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {`<FoozoolLoadingPage 
  text="Initializing application..." 
  logoSize={120} 
/>`}
          </Box>
        </Paper>
      </Box>

      {/* Active loaders */}
      <FoozoolOverlayLoader 
        loading={showOverlay} 
        text="This is an overlay loader example" 
      />

      {showFullPage && (
        <FoozoolLoadingPage text="This is a full page loader example" />
      )}
    </Box>
  );
};

export default FoozoolLoaderExamples;

