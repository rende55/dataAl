import React, { useState } from 'react';
import { 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  useTheme, 
  useMediaQuery, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { useProject } from '../context/ProjectContext';
import { getCategoryDisplayName } from '../utils/fileUtils';

// Tab için ikonlar
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TableChartIcon from '@mui/icons-material/TableChart';
import ListIcon from '@mui/icons-material/List';

const ProjectTabNavigation: React.FC = () => {
  const { currentProject, activeTab, setActiveTab, addTab, removeTab, getAllTabs } = useProject();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTabForMenu, setSelectedTabForMenu] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Tab değişikliği
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Tab ikonları
  const getTabIcon = (category: string) => {
    // Burada özel tab ikonları eklenebilir
    if (category.toLowerCase().includes('fiyat') || category.toLowerCase().includes('price')) {
      return <TableChartIcon />;
    } else if (category.toLowerCase().includes('liste') || category.toLowerCase().includes('list')) {
      return <ListIcon />;
    }
    return <FolderIcon />;
  };

  // Yeni tab dialog'unu aç
  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
    setNewTabName('');
    setError('');
  };

  // Yeni tab dialog'unu kapat
  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  // Yeni tab ekle
  const handleAddTab = () => {
    if (!newTabName.trim()) {
      setError('Tab adı boş olamaz.');
      return;
    }

    // Tab adı kontrolü
    if (getAllTabs().includes(newTabName.trim())) {
      setError('Bu isimde bir tab zaten mevcut.');
      return;
    }

    const success = addTab(newTabName.trim());
    if (success) {
      setActiveTab(newTabName.trim());
      setIsAddDialogOpen(false);
    } else {
      setError('Tab eklenirken bir hata oluştu.');
    }
  };

  // Tab menüsünü aç
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, tab: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTabForMenu(tab);
  };

  // Tab menüsünü kapat
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedTabForMenu(null);
  };

  // Tab sil
  const handleRemoveTab = () => {
    if (selectedTabForMenu) {
      removeTab(selectedTabForMenu);
      handleCloseMenu();
    }
  };

  // Tüm tabları al
  const tabs = getAllTabs();

  // Proje yüklenmemişse tab navigasyonunu gösterme
  if (!currentProject) {
    return null;
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        width: '100%', 
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Veri Kategorileri
          </Typography>
          {currentProject && (
            <Chip 
              label={currentProject.name} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Tooltip title="Yeni Tab Ekle">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            size={isMobile ? "small" : "medium"}
          >
            {isDesktop ? "Yeni Kategori" : ""}
          </Button>
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {tabs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2, 
          p: 2, 
          textAlign: 'center',
          backgroundColor: theme.palette.grey[50],
          borderRadius: 1
        }}>
          Henüz hiç tab oluşturulmamış. Yeni bir tab eklemek için "Yeni Kategori" butonuna tıklayın.
        </Typography>
      ) : (
        <Tabs
          value={activeTab || tabs[0]}
          onChange={handleChange}
          variant={isMobile ? "scrollable" : (tabs.length > 5 ? "scrollable" : "fullWidth")}
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Veri kategorileri"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
              fontWeight: theme.typography.fontWeightRegular,
              fontSize: '0.95rem',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: theme.typography.fontWeightMedium,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab}
              value={tab}
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  width: '100%',
                  px: 0.5
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getTabIcon(tab)}
                    <Box component="span" sx={{ ml: 1 }}>
                      {getCategoryDisplayName(tab)}
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, tab)}
                    sx={{ 
                      ml: 1, 
                      opacity: 0.6, 
                      '&:hover': { opacity: 1 },
                      color: 'inherit'
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{ 
                display: 'flex', 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                minWidth: isDesktop ? 120 : 100
              }}
            />
          ))}
        </Tabs>
      )}

      {/* Yeni Tab Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Yeni Kategori Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kategori Adı"
            type="text"
            fullWidth
            variant="outlined"
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            error={!!error}
            helperText={error || "Kategori adı boşluk içermemeli ve camelCase formatında olmalıdır."}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseAddDialog} color="inherit">İptal</Button>
          <Button 
            onClick={handleAddTab} 
            variant="contained" 
            color="primary"
            disabled={!newTabName.trim()}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab Menüsü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRemoveTab} dense>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Kategoriyi Sil" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ProjectTabNavigation;
