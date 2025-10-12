# Quick Start Guide - Foozool Loaders

## Import

```tsx
// Basic inline loader (default export)
import FoozoolLoader from '@/components/foozoolLoader';

// Named exports for specific loaders
import { 
  FoozoolLoadingPage, 
  FoozoolOverlayLoader 
} from '@/components/foozoolLoader';
```

---

## Quick Examples

### 1. Simple Inline Loader (in a component)

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(true);

  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <FoozoolLoader />
      ) : (
        <div>Your content here</div>
      )}
    </Box>
  );
}
```

### 2. Overlay Loader (during form submission)

```tsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await saveData();
    setIsSubmitting(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Your form fields */}
      </form>
      
      <FoozoolOverlayLoader 
        loading={isSubmitting} 
        text="Saving..." 
      />
    </>
  );
}
```

### 3. Full Page Loader (initial app loading)

```tsx
function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadAppData().then(() => setInitializing(false));
  }, []);

  if (initializing) {
    return <FoozoolLoadingPage text="Loading Foozool..." />;
  }

  return <MainApp />;
}
```

---

## Animation Types

Try different animations by changing the `animation` prop:

```tsx
<FoozoolLoader animation="pulse" />   {/* Default - smooth scaling */}
<FoozoolLoader animation="spin" />    {/* Rotating 360° */}
<FoozoolLoader animation="fade" />    {/* Fading in/out */}
<FoozoolLoader animation="bounce" />  {/* Bouncing up/down */}
<FoozoolLoader animation="breathe" /> {/* Gentle breathing */}
<FoozoolLoader animation="glow" />    {/* Glowing effect */}
```

---

## Common Patterns

### Loading Card Content

```tsx
<Card>
  <CardContent>
    {isLoading ? (
      <FoozoolLoader size={60} animation="breathe" />
    ) : (
      <DataDisplay data={data} />
    )}
  </CardContent>
</Card>
```

### API Call with Overlay

```tsx
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    await api.getData();
  } finally {
    setLoading(false);
  }
};

return (
  <>
    <YourComponent />
    <FoozoolOverlayLoader 
      loading={loading} 
      text="Fetching data..." 
    />
  </>
);
```

### Route Loading

```tsx
const MyRouter = () => {
  const [isRouteChanging, setIsRouteChanging] = useState(false);

  // Show loader during route transitions
  if (isRouteChanging) {
    return <FoozoolLoadingPage />;
  }

  return <Routes>{/* your routes */}</Routes>;
};
```

---

## Props Reference

### FoozoolLoader
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animation` | `'pulse' \| 'spin' \| 'fade' \| 'bounce' \| 'breathe' \| 'glow'` | `'pulse'` | Animation type |
| `size` | `number` | `80` | Logo size in pixels |
| `show` | `boolean` | `true` | Show/hide loader |
| `containerStyle` | `React.CSSProperties` | `undefined` | Custom container styles |

### FoozoolOverlayLoader
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | - | Show/hide loader (required) |
| `text` | `string` | `'Loading...'` | Loading message |
| `logoSize` | `number` | `80` | Logo size in pixels |

### FoozoolLoadingPage
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `'Loading...'` | Loading message |
| `logoSize` | `number` | `120` | Logo size in pixels |

---

## Tips

✅ **Do:**
- Use `FoozoolLoader` for inline/component-level loading
- Use `FoozoolOverlayLoader` for blocking operations (forms, API calls)
- Use `FoozoolLoadingPage` for full app initialization or major transitions
- Choose animations that match the context (e.g., 'breathe' for subtle, 'spin' for active processing)

❌ **Don't:**
- Don't use multiple full-page loaders simultaneously
- Don't use very large sizes in small containers
- Don't forget to set `loading={false}` to hide overlay loaders

---

## Need Help?

See the full documentation in `README.md` or check out the examples in `Example.tsx`.

