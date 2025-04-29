import { CssBaseline, Box, useMediaQuery } from '@mui/material'
import { ProjectProvider } from './context/ProjectContext'
import Layout from './components/Layout'
import ProjectSelector from './components/ProjectSelector'
import ProjectTabNavigation from './components/ProjectTabNavigation'
import ExcelUploader from './components/ExcelUploader'
import DataViewer from './components/DataViewer'
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'

function App() {
  const [isProjectSelected, setIsProjectSelected] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // LocalStorage'dan mevcut proje kontrolü
  useEffect(() => {
    const currentProject = localStorage.getItem('dataal-current-project');
    setIsProjectSelected(!!currentProject);
  }, []);

  // Proje seçildiğinde çağrılacak
  const handleProjectSelected = () => {
    setIsProjectSelected(true);
  };

  return (
    <ProjectProvider>
      <CssBaseline />
      <Layout>
        {!isProjectSelected ? (
          <ProjectSelector onProjectSelected={handleProjectSelected} />
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: { xs: 2, sm: 3, md: 4 }
            }}
          >
            <ProjectTabNavigation />
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: isDesktop ? 'row' : 'column',
                gap: { xs: 2, sm: 3, md: 4 },
                alignItems: 'flex-start'
              }}
            >
              <Box 
                sx={{ 
                  width: isDesktop ? '30%' : '100%',
                  minWidth: isDesktop ? 300 : 'auto',
                }}
              >
                <ExcelUploader />
              </Box>
              <Box 
                sx={{ 
                  width: isDesktop ? '70%' : '100%',
                  flexGrow: 1
                }}
              >
                <DataViewer />
              </Box>
            </Box>
          </Box>
        )}
      </Layout>
    </ProjectProvider>
  )
}

export default App
