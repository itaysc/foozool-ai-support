// Helper functions for link styling
export const getLinkColor = (type: string): string => {
  switch (type) {
    case 'log': return '#dc2626';
    case 'dashboard': return '#059669';
    case 'documentation': return '#2563eb';
    case 'ticket': return '#7c3aed';
    case 'system': return '#ea580c';
    default: return '#6b7280';
  }
};

export const getChipColor = (type: string): string => {
  switch (type) {
    case 'log': return '#fef2f2';
    case 'dashboard': return '#f0fdf4';
    case 'documentation': return '#eff6ff';
    case 'ticket': return '#faf5ff';
    case 'system': return '#fff7ed';
    default: return '#f9fafb';
  }
};

export const getChipTextColor = (type: string): string => {
  switch (type) {
    case 'log': return '#dc2626';
    case 'dashboard': return '#059669';
    case 'documentation': return '#2563eb';
    case 'ticket': return '#7c3aed';
    case 'system': return '#ea580c';
    default: return '#6b7280';
  }
};

// Helper function to get severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'red': return '#dc2626';
    case 'yellow': return '#d97706';
    case 'info': return '#0891b2';
    default: return '#6b7280';
  }
};

// Helper function to get severity background color
export const getSeverityBgColor = (severity: string): string => {
  switch (severity) {
    case 'red': return '#fef2f2';
    case 'yellow': return '#fffbeb';
    case 'info': return '#f0f9ff';
    default: return '#f9fafb';
  }
};
