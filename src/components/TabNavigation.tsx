import React from 'react';
import { Tabs, Tab, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { DataCategory } from '../types';
import { useData } from '../context/DataContext';
import { getCategoryDisplayName } from '../utils/fileUtils';

// Tab için ikonlar
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';
import ConstructionIcon from '@mui/icons-material/Construction';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UpdateIcon from '@mui/icons-material/Update';
import FolderIcon from '@mui/icons-material/Folder';

const TabNavigation: React.FC = () => {
  const { activeTab, setActiveTab, getAllCategories } = useData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Tab değişikliği
  const handleChange = (_event: React.SyntheticEvent, newValue: DataCategory) => {
    setActiveTab(newValue);
  };

  // Tab ikonları
  const getTabIcon = (category: DataCategory) => {
    switch (category) {
      case 'yapiSiniflari':
        return <CategoryIcon />;
      case 'birimFiyatlar':
        return <AttachMoneyIcon />;
      case 'binaYasGruplari':
        return <HomeIcon />;
      case 'yapiTeknikleri':
        return <ConstructionIcon />;
      case 'mevzuatlar':
        return <MenuBookIcon />;
      case 'guncelBilgiler':
        return <UpdateIcon />;
      default:
        return <FolderIcon />;
    }
  };

  // Tüm kategorileri al
  const categories = getAllCategories();

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Veri Kategorileri
      </Typography>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant={isMobile ? "scrollable" : "fullWidth"}
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
          },
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category}
            value={category}
            label={getCategoryDisplayName(category)}
            icon={getTabIcon(category)}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default TabNavigation;
