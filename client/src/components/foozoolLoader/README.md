# Foozool Logo Loader Components

A collection of animated loader components using the Foozool logo for consistent branding across loading states.

## Components

### 1. FoozoolLoader (Basic Inline Loader)

A flexible inline loader component with multiple animation types.

**Usage:**

```tsx
import FoozoolLoader from '@/components/foozoolLoader';

// Basic usage with default pulse animation
<FoozoolLoader />

// With custom animation type
<FoozoolLoader animation="spin" />
<FoozoolLoader animation="fade" />
<FoozoolLoader animation="bounce" />
<FoozoolLoader animation="breathe" />
<FoozoolLoader animation="glow" />

// With custom size
<FoozoolLoader size={120} />

// Conditional display
<FoozoolLoader show={isLoading} />

// With custom container styling
<FoozoolLoader 
  containerStyle={{ 
    padding: '20px',
    backgroundColor: '#f5f5f5' 
  }} 
/>
```

**Props:**

- `animation?: 'pulse' | 'spin' | 'fade' | 'bounce' | 'breathe' | 'glow'` - Animation type (default: 'pulse')
- `size?: number` - Logo size in pixels (default: 80)
- `show?: boolean` - Whether to show the loader (default: true)
- `containerStyle?: React.CSSProperties` - Custom styles for the container

---

### 2. FoozoolLoadingPage (Full-Page Loader)

A full-screen loading page with animated logo and loading text. Best used for initial app loading or major transitions.

**Usage:**

```tsx
import FoozoolLoadingPage from '@/components/foozoolLoader/FoozoolLoadingPage';

// Basic usage
<FoozoolLoadingPage />

// With custom text
<FoozoolLoadingPage text="Initializing application..." />

// With custom logo size
<FoozoolLoadingPage logoSize={150} />

// Complete example
<FoozoolLoadingPage 
  text="Loading your dashboard..." 
  logoSize={120} 
/>
```

**Props:**

- `text?: string` - Loading text to display (default: 'Loading...')
- `logoSize?: number` - Logo size in pixels (default: 120)

**Features:**

- Full viewport coverage with fixed positioning
- Gradient background matching brand colors
- Floating logo animation with glow effect
- Animated progress line below text
- High z-index (9999) to overlay all content

---

### 3. FoozoolOverlayLoader (Overlay Loader)

A centered overlay loader that appears on top of existing content with backdrop blur.

**Usage:**

```tsx
import FoozoolOverlayLoader from '@/components/foozoolLoader/FoozoolOverlayLoader';

// Basic usage
<FoozoolOverlayLoader loading={isLoading} />

// With custom text
<FoozoolOverlayLoader 
  loading={isLoading} 
  text="Saving changes..." 
/>

// With custom logo size
<FoozoolOverlayLoader 
  loading={isLoading} 
  logoSize={100} 
/>

// Complete example
<FoozoolOverlayLoader 
  loading={isSubmitting} 
  text="Processing your request..." 
  logoSize={90} 
/>
```

**Props:**

- `loading: boolean` - Whether to show the loader (required)
- `text?: string` - Loading text to display (default: 'Loading...')
- `logoSize?: number` - Logo size in pixels (default: 80)

**Features:**

- Semi-transparent dark overlay with backdrop blur
- White rounded container with shadow
- Pulse and glow animation
- Smooth fade-in transition
- High z-index (9999) to overlay all content

---

## Animation Types (for FoozoolLoader)

- **pulse**: Logo scales up and down smoothly (default)
- **spin**: Logo rotates 360 degrees continuously
- **fade**: Logo fades in and out
- **bounce**: Logo bounces up and down
- **breathe**: Gentle scaling with opacity change
- **glow**: Logo glows with brand color shadow

---

## Use Cases

### FoozoolLoader
- Inside cards or sections while content loads
- Inline loading indicators
- Small loading states in buttons or forms

### FoozoolLoadingPage
- Initial app loading screen
- Major route/page transitions
- Authentication flows
- Large data loading operations

### FoozoolOverlayLoader
- Form submissions
- API calls that block interaction
- Modal content loading
- Action confirmations with processing

---

## Examples

### Example 1: Loading inside a card

```tsx
import { Card, CardContent } from '@mui/material';
import FoozoolLoader from '@/components/foozoolLoader';

function DataCard({ isLoading, data }) {
  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <FoozoolLoader animation="breathe" size={60} />
        ) : (
          <div>{data}</div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Example 2: Form submission overlay

```tsx
import FoozoolOverlayLoader from '@/components/foozoolLoader/FoozoolOverlayLoader';

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
      <FoozoolOverlayLoader 
        loading={isSubmitting} 
        text="Saving your changes..." 
      />
    </>
  );
}
```

### Example 3: App-level loading

```tsx
import FoozoolLoadingPage from '@/components/foozoolLoader/FoozoolLoadingPage';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp().then(() => setIsInitializing(false));
  }, []);

  if (isInitializing) {
    return <FoozoolLoadingPage text="Initializing Foozool..." />;
  }

  return <MainApp />;
}
```

---

## Technical Notes

- All animations use CSS keyframes for optimal performance
- Components are built with Material-UI's styling system
- Logo path: `/logo/foozool_logo_transparent_bg.png`
- Animations are GPU-accelerated using transform properties
- TypeScript support with full type definitions

