import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProject } from '../context/ProjectContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ProjectSelectorProps {
  onProjectSelected?: () => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onProjectSelected }) => {
  const { projects, createProject, loadProject, deleteProject } = useProject();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Projeleri LocalStorage'dan yükle
  useEffect(() => {
    // Bu useEffect, bileşen yüklendiğinde ve projelerde değişiklik olduğunda çalışır
    // Böylece projeler ekranına geri dönüldüğünde güncel projeler görüntülenir
    const savedProjects = localStorage.getItem('dataal-projects');
    if (savedProjects) {
      // Bu satır doğrudan projeleri güncellemez, sadece kontrol amaçlı
      // Projeler zaten ProjectContext tarafından yükleniyor
      console.log('Projeler yüklendi:', JSON.parse(savedProjects).length);
    }
  }, []);

  // Proje oluşturma dialog'unu aç
  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setNewProjectName('');
  };

  // Proje oluşturma dialog'unu kapat
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  // Yeni proje oluştur
  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      showSnackbar('Lütfen bir proje adı girin.', 'error');
      return;
    }

    createProject(newProjectName.trim());
    setIsCreateDialogOpen(false);
    showSnackbar(`"${newProjectName.trim()}" projesi oluşturuldu.`, 'success');
    
    // Proje seçildi bilgisini ilet
    if (onProjectSelected) {
      onProjectSelected();
    }
  };

  // Projeyi yükle
  const handleLoadProject = (projectId: string, projectName: string) => {
    const success = loadProject(projectId);
    if (success) {
      showSnackbar(`"${projectName}" projesi yüklendi.`, 'success');
      
      // Proje seçildi bilgisini ilet
      if (onProjectSelected) {
        onProjectSelected();
      }
    } else {
      showSnackbar(`"${projectName}" projesi yüklenemedi.`, 'error');
    }
  };

  // Snackbar gösterme
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Veri Yönetim Paneli
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Projeler
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Yeni Proje
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {projects.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Henüz hiç proje oluşturulmamış. Yeni bir proje oluşturmak için "Yeni Proje" butonuna tıklayın.
          </Alert>
        ) : (
          <List>
            {projects.map((project) => (
              <ListItem
                key={project.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                <ListItemText
                  primary={project.name}
                  secondary={`Oluşturulma: ${formatDate(project.createdAt)} | Son Düzenleme: ${formatDate(project.lastModified)}`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Projeyi Aç">
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleLoadProject(project.id, project.name)}
                      sx={{ mr: 1 }}
                    >
                      <FolderOpenIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Projeyi Sil">
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                        setProjectToDelete({ id: project.id, name: project.name });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Yeni Proje Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={handleCloseCreateDialog}>
        <DialogTitle>Yeni Proje Oluştur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Proje Adı"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>İptal</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={!newProjectName.trim()}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proje Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Projeyi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            {projectToDelete?.name} adlı projeyi silmek istiyor musunuz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>İptal</Button>
          <Button 
            onClick={() => {
              if (projectToDelete) {
                deleteProject(projectToDelete.id);
                setIsDeleteDialogOpen(false);
                showSnackbar(`"${projectToDelete.name}" projesi silindi.`, 'success');
              }
            }} 
            variant="contained" 
            color="error"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectSelector;
