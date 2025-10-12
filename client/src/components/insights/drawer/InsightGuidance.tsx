import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { TrendingUp, People, School, Schedule } from '@mui/icons-material';
import { InsightComponentProps } from '../shared/types';

const InsightGuidance: React.FC<InsightComponentProps> = ({ insight }) => {
  if (!insight?.meta?.guidance) return null;

  const guidance = insight.meta.guidance;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
        Guidance & Action Plan
      </Typography>
      
      <List sx={{ py: 0 }}>
        {/* Summary */}
        {guidance.summary && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Summary"
              secondary={guidance.summary}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ fontSize: '0.875rem', lineHeight: 1.5 }}
            />
          </ListItem>
        )}

        {/* Why */}
        {guidance.why && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Why This Matters"
              secondary={guidance.why}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ fontSize: '0.875rem', lineHeight: 1.5 }}
            />
          </ListItem>
        )}

        {/* Signals */}
        {guidance.signals && guidance.signals.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Key Signals"
              secondary={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {guidance.signals.map((signal: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {signal}
                    </li>
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}

        {/* Actions */}
        {guidance.actions && guidance.actions.length > 0 && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Recommended Actions"
              secondary={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {guidance.actions.map((action: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {action}
                    </li>
                  ))}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}

        {/* Investigation Path */}
        {guidance.investigationPath && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Investigation Path"
              secondary={
                <Box>
                  {guidance.investigationPath.immediate && guidance.investigationPath.immediate.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
                        Immediate Actions:
                      </div>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {guidance.investigationPath.immediate.map((action: string, i: number) => (
                          <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {action}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {guidance.investigationPath.rootCause && guidance.investigationPath.rootCause.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#d97706', fontSize: '0.875rem' }}>
                        Root Cause Analysis:
                      </div>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {guidance.investigationPath.rootCause.map((action: string, i: number) => (
                          <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {action}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {guidance.investigationPath.customerCommunication && guidance.investigationPath.customerCommunication.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#0891b2', fontSize: '0.875rem' }}>
                        Customer Communication:
                      </div>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {guidance.investigationPath.customerCommunication.map((action: string, i: number) => (
                          <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {action}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {guidance.investigationPath.longTermSolutions && guidance.investigationPath.longTermSolutions.length > 0 && (
                    <Box>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#059669', fontSize: '0.875rem' }}>
                        Long-term Solutions:
                      </div>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {guidance.investigationPath.longTermSolutions.map((action: string, i: number) => (
                          <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {action}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              }
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        )}

        {/* Considerations */}
        {guidance.considerations && (
          <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemText 
              primary="Additional Considerations"
              secondary={guidance.considerations}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              secondaryTypographyProps={{ fontSize: '0.875rem', lineHeight: 1.5 }}
            />
          </ListItem>
        )}

        {/* Owner and SLA */}
        <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
          <ListItemText 
            primary="Ownership & Timeline"
            secondary={
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <span style={{ fontSize: '0.875rem' }}>
                    Owner: {guidance.owner}
                  </span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <span style={{ fontSize: '0.875rem' }}>
                    SLA: {guidance.slaDays} days
                  </span>
                </Box>
              </Box>
            }
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            secondaryTypographyProps={{ component: 'div' }}
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default InsightGuidance;
