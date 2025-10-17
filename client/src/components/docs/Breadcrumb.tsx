import React from 'react';
import {
  Breadcrumbs,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  Home,
  NavigateNext,
  FolderOpen
} from '@mui/icons-material';

interface BreadcrumbProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentPath,
  onPathChange
}) => {
  const getPathSegments = (path: string): Array<{ name: string; path: string }> => {
    if (path === '/') {
      return [{ name: 'All Documents', path: '/' }];
    }

    const segments = path.split('/').filter(segment => segment.length > 0);
    const breadcrumbs: Array<{ name: string; path: string }> = [
      { name: 'All Documents', path: '/' }
    ];

    let currentSegmentPath = '';
    segments.forEach(segment => {
      currentSegmentPath += `/${segment}`;
      breadcrumbs.push({
        name: segment,
        path: currentSegmentPath
      });
    });

    return breadcrumbs;
  };

  const pathSegments = getPathSegments(currentPath);

  const handleSegmentClick = (path: string) => {
    onPathChange(path);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const isRoot = segment.path === '/';

          return (
            <Box
              key={segment.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: isLast ? 'default' : 'pointer',
                '&:hover': isLast ? {} : {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.25
                }
              }}
              onClick={() => !isLast && handleSegmentClick(segment.path)}
            >
              {isRoot ? (
                <Home 
                  fontSize="small" 
                  sx={{ 
                    mr: 0.5, 
                    color: isLast ? 'primary.main' : 'text.secondary' 
                  }} 
                />
              ) : (
                <FolderOpen 
                  fontSize="small" 
                  sx={{ 
                    mr: 0.5, 
                    color: isLast ? 'primary.main' : 'text.secondary' 
                  }} 
                />
              )}
              
              <Typography
                variant="body2"
                color={isLast ? 'primary.main' : 'text.secondary'}
                sx={{
                  fontWeight: isLast ? 600 : 400,
                  fontSize: '0.875rem'
                }}
              >
                {segment.name}
              </Typography>
            </Box>
          );
        })}
      </Breadcrumbs>

      {/* Current path indicator */}
      {currentPath !== '/' && (
        <Chip
          label={`${pathSegments.length - 1} level${pathSegments.length - 1 !== 1 ? 's' : ''} deep`}
          size="small"
          variant="outlined"
          sx={{ 
            ml: 2,
            height: 24,
            fontSize: '0.75rem',
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
      )}
    </Box>
  );
};

export default Breadcrumb;
