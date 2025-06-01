import React from 'react';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from 'styled-components';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import theme from './styles/theme'; // Update the path based on your project structure
import muiTheme from './styles/muiTheme';
import { Container } from '@mui/material';
import Router from './router';
import { MainLayoutProvider } from './context/mainLayout.context';
import './styles/main.css';


const App = () => (
  <MUIThemeProvider theme={muiTheme}>
    <SnackbarProvider maxSnack={3}>
      <ThemeProvider theme={theme}>
        <MainLayoutProvider>
          <Router>
            <Container>
              <Router />
            </Container>
          </Router>
        </MainLayoutProvider>
      </ThemeProvider>
    </SnackbarProvider>
  </MUIThemeProvider>

);

export default App;
