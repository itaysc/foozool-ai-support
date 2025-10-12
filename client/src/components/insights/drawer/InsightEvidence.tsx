import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { InsightComponentProps } from '../shared/types';
import { getLinkColor, getChipColor, getChipTextColor } from '../shared/utils';

const InsightEvidence: React.FC<InsightComponentProps> = ({ insight }) => {
  const navigate = useNavigate();
  
  if (!insight?.meta?.guidance?.evidence) return null;

  const evidence = insight.meta.guidance.evidence;

  const handleLinkClick = (url: string, event: React.MouseEvent) => {
    if (url.startsWith('/')) {
      event.preventDefault();
      navigate(url);
    }
    // External links will open in new tab as usual
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
        Evidence & Supporting Data
      </Typography>
      
      <List sx={{ py: 0 }}>
        {/* Ticket References */}
        {evidence.ticketReferences && evidence.ticketReferences.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Ticket References"
              secondary={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {evidence.ticketReferences.map((ticket: string, i: number) => (
                    <Chip 
                      key={i} 
                      label={ticket} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
          </ListItem>
        )}

        {/* Error Patterns */}
        {evidence.errorPatterns && evidence.errorPatterns.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Error Patterns"
              secondary={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {evidence.errorPatterns.map((pattern: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5, fontFamily: 'monospace' }}>
                      {pattern}
                    </li>
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}

        {/* Affected Systems */}
        {evidence.affectedSystems && evidence.affectedSystems.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Affected Systems"
              secondary={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {evidence.affectedSystems.map((system: string, i: number) => (
                    <Chip 
                      key={i} 
                      label={system} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
          </ListItem>
        )}

        {/* Time Patterns */}
        {evidence.timePatterns && evidence.timePatterns.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Time Patterns"
              secondary={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {evidence.timePatterns.map((pattern: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {pattern}
                    </li>
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}

        {/* Related Links */}
        {evidence.links && evidence.links.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Related Links"
              secondary={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {evidence.links.map((link: any, i: number) => (
                    <li key={i}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                        <a 
                          href={link.url} 
                          target={link.url.startsWith('/') ? undefined : '_blank'}
                          rel={link.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                          style={{ 
                            color: getLinkColor(link.type),
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                          onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                          onClick={(e) => handleLinkClick(link.url, e)}
                        >
                          {link.label}
                        </a>
                        <Chip 
                          label={link.type} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            height: 16, 
                            fontSize: '0.7rem',
                            backgroundColor: getChipColor(link.type),
                            color: getChipTextColor(link.type)
                          }}
                        />
                      </Box>
                      {link.description && (
                        <div style={{ color: '#666', fontSize: '0.8rem', marginLeft: '1rem' }}>
                          {link.description}
                        </div>
                      )}
                    </li>
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default InsightEvidence;
