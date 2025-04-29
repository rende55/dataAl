import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tabs,
  Tab,
  Alert,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef, GridCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useProject } from '../context/ProjectContext';
import { DataType } from '../types';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useElectron } from '../hooks/useElectron';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-tabpanel-${index}`}
      aria-labelledby={`data-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DataViewer: React.FC = () => {
  const { currentProject, activeTab, updateProjectData, saveProject, downloadProjectAsJson } = useProject();
  const { saveJsonFile, isElectron } = useElectron();
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState(0);
  const [dataType, setDataType] = useState<DataType>(DataType.UNKNOWN);
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Veri değiştiğinde veya tab değiştiğinde tabloyu güncelle
  useEffect(() => {
    if (!currentProject || !activeTab) return;
    
    const activeData = currentProject.data[activeTab];
    if (!activeData) return;
    
    // Yeni JSON formatı kontrolü (type, x_labels, y_labels, data)
    let processedData = activeData;
    if (activeData && typeof activeData === 'object' && !Array.isArray(activeData) && 
        'type' in activeData && 'data' in activeData) {
      // Veri türünü belirle
      const type = activeData.type === 'liste' ? DataType.LIST : DataType.TABLE;
      setDataType(type);
      
      // Yeni format, data özelliğini kullan
      processedData = activeData.data;
    } else {
      // Veri türünü belirle
      const type = Array.isArray(processedData) ? DataType.LIST : DataType.TABLE;
      setDataType(type);
    }
    
    if (dataType === DataType.LIST) {
      // Liste verisi
      handleListData(Array.isArray(processedData) ? processedData : []);
    } else {
      // Tablo verisi
      handleTableData(typeof processedData === 'object' && !Array.isArray(processedData) ? processedData : {});
    }
  }, [currentProject, activeTab]);

  // Liste verilerini işle
  const handleListData = (data: any[]) => {
    // Veri yapısı kontrolü
    if (!data || !Array.isArray(data)) {
      setColumns([
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'message', headerName: 'Mesaj', width: 300 }
      ]);
      setRows([{ id: 1, message: 'Geçersiz veri formatı.' }]);
      return;
    }
    
    if (data.length > 0) {
      // Tablo sütunlarını oluştur
      const cols: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { 
          field: 'value', 
          headerName: 'Değer', 
          width: 300, 
          editable: false,
          valueFormatter: (params: GridValueFormatterParams) => {
            // Null kontrolü ekleyelim
            if (params === null || params === undefined) return '';
            // Value kontrolü ekleyelim
            return params.value !== undefined && params.value !== null ? params.value : '';
          }
        }
      ];
      
      // İşlem sütunu ekle
      cols.push(createActionsColumn());
      
      setColumns(cols);
      
      // Satırları oluştur
      const rowsWithId = data.map((item, index) => ({
        id: index + 1,
        value: item
      }));
      
      setRows(rowsWithId);
    } else {
      // Veri yoksa boş tablo göster
      setColumns([
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'message', headerName: 'Mesaj', width: 300 }
      ]);
      setRows([{ id: 1, message: 'Bu kategoride henüz veri yok.' }]);
    }
  };

  // Tablo verilerini işle
  const handleTableData = (data: Record<string, any>) => {
    // Veri yapısı kontrolü
    if (!data || typeof data !== 'object') {
      setColumns([
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'message', headerName: 'Mesaj', width: 300 }
      ]);
      setRows([{ id: 1, message: 'Geçersiz veri formatı.' }]);
      return;
    }
    
    // Yeni JSON formatı kontrolü (type, x_labels, y_labels, data)
    if (data.type && data.data) {
      // Yeni format, data özelliğini kullan
      data = data.data;
    }
    
    const rowKeys = Object.keys(data);
    
    if (rowKeys.length > 0) {
      const firstRow = data[rowKeys[0]];
      
      // firstRow null veya undefined ise boş bir nesne kullan
      const colKeys = firstRow && typeof firstRow === 'object' ? Object.keys(firstRow) : [];
      
      // Tablo sütunlarını oluştur
      const cols: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'rowKey', headerName: 'Satır', width: 150, editable: false }
      ];
      
      // Veri özelliklerinden sütunlar oluştur
      colKeys.forEach(key => {
        cols.push({
          field: key,
          headerName: key,
          width: 150,
          editable: false,
          valueFormatter: (params: GridValueFormatterParams) => {
            // Null kontrolü ekleyelim
            if (params === null || params === undefined) return '';
            // Value kontrolü ekleyelim
            return params.value !== undefined && params.value !== null ? params.value : '';
          }
        });
      });
      
      // İşlem sütunu ekle
      cols.push(createActionsColumn());
      
      setColumns(cols);
      
      // Satırları oluştur
      const rowsWithId = rowKeys.map((rowKey, index) => ({
        id: index + 1,
        rowKey,
        ...data[rowKey]
      }));
      
      setRows(rowsWithId);
    } else {
      // Veri yoksa boş tablo göster
      setColumns([
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'message', headerName: 'Mesaj', width: 300 }
      ]);
      setRows([{ id: 1, message: 'Bu kategoride henüz veri yok.' }]);
    }
  };

  // İşlem sütunu oluştur
  const createActionsColumn = (): GridColDef => {
    return {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridCellParams) => (
        <Box>
          <Tooltip title="Düzenle">
            <IconButton 
              size="small" 
              onClick={() => handleEditClick(params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton 
              size="small" 
              onClick={() => handleDeleteClick(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    };
  };

  // Düzenleme dialog'unu aç
  const handleEditClick = (row: any) => {
    setCurrentRow(row);
    
    // Düzenlenecek değerleri hazırla
    const values: Record<string, any> = {};
    
    if (dataType === DataType.LIST) {
      values.value = row.value;
    } else {
      // Tablo verisi için tüm alanları al
      Object.keys(row).forEach(key => {
        if (key !== 'id' && key !== 'actions') {
          values[key] = row[key];
        }
      });
    }
    
    setEditedValues(values);
    setIsEditDialogOpen(true);
  };

  // Silme dialog'unu aç
  const handleDeleteClick = (row: any) => {
    setCurrentRow(row);
    setIsDeleteDialogOpen(true);
  };

  // Yeni satır dialog'unu aç
  const handleAddClick = () => {
    // Yeni satır için boş değerler hazırla
    const values: Record<string, any> = {};
    
    if (dataType === DataType.TABLE && rows.length > 0) {
      // Tablo verisi için tüm alanları al
      Object.keys(rows[0]).forEach(key => {
        if (key !== 'id' && key !== 'actions') {
          values[key] = '';
        }
      });
    } else if (dataType === DataType.LIST) {
      values.value = '';
    }
    
    setNewRow(values);
    setIsAddDialogOpen(true);
  };

  // Kaydetme dialog'unu aç
  const handleSaveClick = () => {
    setIsSaveDialogOpen(true);
  };

  // İndirme dialog'unu aç
  const handleDownloadClick = () => {
    setIsDownloadDialogOpen(true);
  };

  // Düzenleme değişikliği
  const handleEditChange = (field: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Yeni satır değişikliği
  const handleNewRowChange = (field: string, value: any) => {
    setNewRow(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Satırı güncelle
  const handleUpdateRow = () => {
    if (!currentProject || !activeTab || !currentRow) return;
    
    // Güncellenmiş veriyi hazırla
    let updatedData: any[] | Record<string, any> = [];
    
    if (dataType === DataType.LIST) {
      // Liste verisi güncelleme
      updatedData = [...rows].map(row => {
        if (row.id === currentRow.id) {
          return { ...row, value: editedValues.value };
        }
        return row;
      }).map(row => row.value);
    } else {
      // Tablo verisi güncelleme
      const tableData: Record<string, any> = {};
      
      rows.forEach(row => {
        if (row.id === currentRow.id) {
          // Satır anahtarını al
          const rowKey = editedValues.rowKey || row.rowKey;
          
          // Satır değerlerini al
          const rowValues: Record<string, any> = {};
          Object.keys(editedValues).forEach(key => {
            if (key !== 'rowKey' && key !== 'id') {
              rowValues[key] = editedValues[key];
            }
          });
          
          tableData[rowKey] = rowValues;
        } else {
          tableData[row.rowKey] = Object.keys(row)
            .filter(key => key !== 'id' && key !== 'rowKey')
            .reduce((obj, key) => {
              obj[key] = row[key];
              return obj;
            }, {} as Record<string, any>);
        }
      });
      
      updatedData = tableData;
    }
    
    // Veriyi güncelle
    updateProjectData(activeTab, updatedData);
    setIsEditDialogOpen(false);
  };

  // Satırı sil
  const handleDeleteRow = () => {
    if (!currentProject || !activeTab || !currentRow) return;
    
    // Silinmiş veriyi hazırla
    let updatedData: any[] | Record<string, any> = [];
    
    if (dataType === DataType.LIST) {
      // Liste verisi silme
      updatedData = [...rows]
        .filter(row => row.id !== currentRow.id)
        .map(row => row.value);
    } else {
      // Tablo verisi silme
      const tableData: Record<string, any> = {};
      
      rows.forEach(row => {
        if (row.id !== currentRow.id) {
          tableData[row.rowKey] = Object.keys(row)
            .filter(key => key !== 'id' && key !== 'rowKey')
            .reduce((obj, key) => {
              obj[key] = row[key];
              return obj;
            }, {} as Record<string, any>);
        }
      });
      
      updatedData = tableData;
    }
    
    // Veriyi güncelle
    updateProjectData(activeTab, updatedData);
    setIsDeleteDialogOpen(false);
  };

  // Yeni satır ekle
  const handleAddRow = () => {
    if (!currentProject || !activeTab) return;
    
    // Yeni satırı ekle
    let updatedData: any[] | Record<string, any> = [];
    
    if (dataType === DataType.LIST) {
      // Liste verisi ekleme
      updatedData = [...rows.map(row => row.value), newRow.value];
    } else {
      // Tablo verisi ekleme
      const tableData: Record<string, any> = {};
      
      // Mevcut satırları kopyala
      rows.forEach(row => {
        tableData[row.rowKey] = Object.keys(row)
          .filter(key => key !== 'id' && key !== 'rowKey')
          .reduce((obj, key) => {
            obj[key] = row[key];
            return obj;
          }, {} as Record<string, any>);
      });
      
      // Yeni satırı ekle
      const rowKey = newRow.rowKey;
      if (rowKey) {
        const rowValues: Record<string, any> = {};
        Object.keys(newRow).forEach(key => {
          if (key !== 'rowKey') {
            rowValues[key] = newRow[key];
          }
        });
        
        tableData[rowKey] = rowValues;
      }
      
      updatedData = tableData;
    }
    
    // Veriyi güncelle
    updateProjectData(activeTab, updatedData);
    setIsAddDialogOpen(false);
  };

  // Projeyi kaydet
  const handleSaveProject = async () => {
    const success = await saveProject();
    setIsSaveDialogOpen(false);
  };

  // Projeyi indir
  const handleDownloadProject = async () => {
    if (isElectron) {
      const result = await saveJsonFile(`${currentProject.id}.json`, currentProject);
      if (result.success) {
        showSnackbar(`Projeyi başarıyla kaydetti: ${result.filePath}`, 'success');
      } else {
        showSnackbar(`Projeyi kaydetme hatası: ${result.error}`, 'error');
      }
    } else {
      downloadProjectAsJson();
    }
    setIsDownloadDialogOpen(false);
  };

  // Görünüm modu değiştirme
  const handleViewModeChange = (_event: React.SyntheticEvent, newValue: number) => {
    setViewMode(newValue);
  };

  // Proje veya tab yoksa mesaj göster
  if (!currentProject || !activeTab) {
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: 2,
          height: '100%'
        }}
      >
        <Alert severity="info">
          {!currentProject 
            ? 'Lütfen önce bir proje seçin veya oluşturun.' 
            : 'Lütfen bir veri kategorisi seçin veya oluşturun.'}
        </Alert>
      </Paper>
    );
  }

  // Aktif tab verisi
  const activeData = currentProject.data[activeTab];

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        width: '100%',
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Veri Görüntüleme
          </Typography>
          <Chip 
            icon={dataType === DataType.TABLE ? <TableChartIcon /> : <ViewListIcon />}
            label={dataType === DataType.TABLE ? "Tablo" : "Liste"} 
            color="primary" 
            variant="outlined"
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSaveClick}
          >
            Kaydet
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadClick}
          >
            İndir
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={viewMode} 
          onChange={handleViewModeChange}
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
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TableChartIcon sx={{ mr: 0.5, fontSize: 20 }} />
                <span>Tablo Görünümü</span>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewListIcon sx={{ mr: 0.5, fontSize: 20 }} />
                <span>JSON Görünümü</span>
              </Box>
            } 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={viewMode} index={0}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mb: 2 
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={!activeTab}
          >
            Yeni Satır Ekle
          </Button>
        </Box>
        
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 25]}
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.secondary,
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              '& .MuiDataGrid-columnSeparator': {
                visibility: 'hidden',
              },
            }}
          />
        </Box>
      </TabPanel>
      
      <TabPanel value={viewMode} index={1}>
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.grey[50], 
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            height: 400,
            overflow: 'auto'
          }}
        >
          {activeData ? (
            <JsonView 
              data={activeData} 
              shouldExpandNode={() => true} 
              style={{ 
                background: 'transparent',
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              Bu kategoride henüz veri yok.
            </Typography>
          )}
        </Box>
      </TabPanel>

      {/* Düzenleme Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Veri Düzenle</DialogTitle>
        <DialogContent dividers>
          {currentRow && (
            <Box sx={{ pt: 1 }}>
              {Object.keys(editedValues).map(field => (
                <TextField
                  key={field}
                  label={field}
                  value={editedValues[field] || ''}
                  onChange={(e) => handleEditChange(field, e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleUpdateRow} 
            variant="contained" 
            color="primary"
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Veri Sil</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Bu veriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleDeleteRow} 
            variant="contained" 
            color="error"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeni Satır Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yeni Satır Ekle</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {Object.keys(newRow).map(field => (
              <TextField
                key={field}
                label={field}
                value={newRow[field] || ''}
                onChange={(e) => handleNewRowChange(field, e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsAddDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleAddRow} 
            variant="contained" 
            color="primary"
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kaydetme Dialog */}
      <Dialog 
        open={isSaveDialogOpen} 
        onClose={() => setIsSaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Projeyi Kaydet</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Tüm değişiklikleriniz kaydedilecek. Devam etmek istiyor musunuz?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsSaveDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* İndirme Dialog */}
      <Dialog 
        open={isDownloadDialogOpen} 
        onClose={() => setIsDownloadDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Projeyi İndir</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Proje JSON formatında indirilecek. Devam etmek istiyor musunuz?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsDownloadDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleDownloadProject} 
            variant="contained" 
            color="primary"
            startIcon={<DownloadIcon />}
          >
            İndir
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DataViewer;
