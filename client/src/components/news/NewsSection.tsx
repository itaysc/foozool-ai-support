import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Link,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
  ExpandMore,
  OpenInNew,
  Newspaper,
  Assignment,
  PriorityHigh,
  Business,
  Timeline
} from '@mui/icons-material';
import newsStore from '@/stores/news.store';
import { format } from 'date-fns';

interface NewsSectionProps {
  organizationId: string;
}

const NewsSection = observer(({ organizationId }: NewsSectionProps) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  useEffect(() => {
    if (organizationId) {
      newsStore.fetchFullNewsData(organizationId);
    }
  }, [organizationId]);

  const handleRefresh = () => {
    newsStore.refreshData(organizationId);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <PriorityHigh color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp color="success" />;
      case 'negative':
        return <TrendingDown color="error" />;
      case 'neutral':
        return <TrendingFlat color="action" />;
      default:
        return <Info />;
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (newsStore.isLoading && !newsStore.hasData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (newsStore.error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {newsStore.error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" fontWeight="bold" display="flex" alignItems="center" gap={1}>
          <Newspaper color="primary" />
          News & Market Intelligence
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {newsStore.lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {newsStore.lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh news">
            <IconButton onClick={handleRefresh} disabled={newsStore.isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Action Items Section */}
      {newsStore.actionItems && newsStore.actionItems.actionItems.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <Assignment color="primary" />
            Action Items ({newsStore.actionItems.actionItems.length})
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={2}>
            {newsStore.highPriorityActionItems.map((item, index) => (
              <Card key={index} sx={{ flex: '1 1 400px', minWidth: '400px', border: '2px solid #f44336' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {getPriorityIcon(item.priority)}
                    <Typography variant="h6" component="h3">
                      {item.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {item.description}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    <Chip 
                      label={item.priority} 
                      size="small" 
                      color={getPriorityColor(item.priority) as any}
                    />
                    <Chip 
                      label={item.category} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  {item.suggestedActions.length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight="bold" mb={1}>
                        Suggested Actions:
                      </Typography>
                      <List dense>
                        {item.suggestedActions.map((action, actionIndex) => (
                          <ListItem key={actionIndex} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <CheckCircle fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={action} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Medium and Low Priority Items */}
          {(newsStore.mediumPriorityActionItems.length > 0 || newsStore.lowPriorityActionItems.length > 0) && (
            <Accordion expanded={expanded === 'other-actions'} onChange={handleAccordionChange('other-actions')}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  Other Action Items ({newsStore.mediumPriorityActionItems.length + newsStore.lowPriorityActionItems.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {[...newsStore.mediumPriorityActionItems, ...newsStore.lowPriorityActionItems].map((item, index) => (
                    <Card key={index} sx={{ flex: '1 1 350px', minWidth: '350px' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getPriorityIcon(item.priority)}
                          <Typography variant="h6" component="h3">
                            {item.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {item.description}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          <Chip 
                            label={item.priority} 
                            size="small" 
                            color={getPriorityColor(item.priority) as any}
                          />
                          <Chip 
                            label={item.category} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* News Summary Section */}
      {newsStore.newsSummary && (
        <Box mb={3}>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <Timeline color="primary" />
            News Summary
          </Typography>
          <Card>
            <CardContent>
              <Typography variant="body1" paragraph>
                {newsStore.newsSummary.summary}
              </Typography>
              <Box display="flex" gap={2}>
                <Chip 
                  label={`${newsStore.newsSummary.newsCount} total articles`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={`${newsStore.newsSummary.relevantNewsCount} relevant`} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* News Items Section */}
      {newsStore.newsData && newsStore.newsData.news.length > 0 && (
        <Box>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <Business color="primary" />
            Relevant News ({newsStore.newsData.news.length})
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            {newsStore.newsData.news
              .filter(item => item.relevance === 'high' || item.relevance === 'medium')
              .slice(0, 10)
              .map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                        {item.title}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Open article">
                          <IconButton 
                            size="small" 
                            component={Link} 
                            href={item.link} 
                            target="_blank"
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {item.contentSnippet}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" gap={1}>
                        <Chip 
                          label={item.relevance} 
                          size="small" 
                          color={getRelevanceColor(item.relevance) as any}
                        />
                        <Chip 
                          label={item.impact} 
                          size="small" 
                          variant="outlined"
                          icon={getImpactIcon(item.impact)}
                        />
                        {item.categories.slice(0, 2).map((category, catIndex) => (
                          <Chip 
                            key={catIndex}
                            label={category} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.source} • {format(new Date(item.pubDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        </Box>
      )}

      {/* No Data State */}
      {!newsStore.hasData && !newsStore.isLoading && (
        <Alert severity="info">
          <AlertTitle>No News Data</AlertTitle>
          No news data available for this organization. The news monitoring system will fetch relevant news daily.
        </Alert>
      )}
    </Box>
  );
});

export default NewsSection; 