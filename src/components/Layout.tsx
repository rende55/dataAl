import React from 'react';
import { Box, CssBaseline, Container, Paper, Typography, AppBar, Toolbar, useMediaQuery, Button, Chip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StorageIcon from '@mui/icons-material/Storage';
import HomeIcon from '@mui/icons-material/Home';
import { useProject } from '../context/ProjectContext';

// Tema oluşturma
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f7fa',
        },
      },
    },
  },
});

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { currentProject, resetProject } = useProject();

  // Proje seçme ekranına geri dön
  const handleBackToProjects = () => {
    // LocalStorage'dan mevcut proje bilgisini temizle
    localStorage.removeItem('dataal-current-project');
    // Context'teki proje bilgisini sıfırla
    resetProject();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', color: 'primary.main' }}>
          <Toolbar>
            <StorageIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Veri Yönetim Paneli
              {currentProject && (
                <Chip 
                  label={currentProject.info.name} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2, verticalAlign: 'middle' }} 
                />
              )}
            </Typography>
            
            {currentProject && (
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<HomeIcon />} 
                size="small"
                onClick={handleBackToProjects}
              >
                Projeler
              </Button>
            )}
          </Toolbar>
        </AppBar>
        
        <Container 
          maxWidth={isDesktop ? "xl" : "lg"} 
          sx={{ 
            mt: { xs: 2, sm: 3, md: 4 }, 
            mb: { xs: 2, sm: 3, md: 4 }, 
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          <Paper 
            elevation={1} 
            sx={{ 
              p: { xs: 2, sm: 3, md: 4 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {children}
          </Paper>
        </Container>
        
        <Box 
          component="footer" 
          sx={{ 
            py: 2, 
            bgcolor: 'background.paper', 
            textAlign: 'center',
            borderTop: '1px solid #eaeaea'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {new Date().getFullYear()} Veri Yönetim Paneli
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
