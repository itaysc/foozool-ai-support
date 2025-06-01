import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GlobalStyles from '@/styles/global';
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <>
    <GlobalStyles />
    <App />
  </>
);

