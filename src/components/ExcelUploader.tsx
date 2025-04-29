import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useProject } from '../context/ProjectContext';
import { excelToPreview, isValidFileExtension, getCategoryDisplayName, convertPreviewToFinalData } from '../utils/fileUtils';
import { TabCategory, DataType, ExcelPreviewData } from '../types';
import { useElectron } from '../hooks/useElectron';

const ExcelUploader: React.FC = () => {
  const { currentProject, updateProjectData, addTab, getAllTabs, isTabExists, setActiveTab } = useProject();
  const { openExcelFile, isElectron } = useElectron();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabCategory>('');
  const [newTabName, setNewTabName] = useState('');
  const [tabOption, setTabOption] = useState('existing'); // 'existing' veya 'new'
  const [previewData, setPreviewData] = useState<ExcelPreviewData | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<DataType>(DataType.UNKNOWN);
  const [previewTab, setPreviewTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Dosya seçimi
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      await processFile(event.target.files[0]);
    }
  };

  // Dosya işleme
  const processFile = async (file: File) => {
    if (isValidFileExtension(file)) {
      setSelectedFile(file);
      try {
        // Dosyayı önizleme için yükle
        const preview = await excelToPreview(file);
        setPreviewData(preview);
        setSelectedDataType(preview.type);
        setIsDialogOpen(true);
      } catch (error) {
        showSnackbar('Dosya işlenirken bir hata oluştu.', 'error');
      }
    } else {
      showSnackbar('Lütfen geçerli bir Excel veya CSV dosyası seçin.', 'error');
    }
  };

  // Tab seçimi
  const handleTabChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTab(event.target.value as TabCategory);
  };

  // Yeni tab adı değişimi
  const handleNewTabNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTabName(event.target.value);
  };

  // Tab seçeneği değişimi
  const handleTabOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTabOption(event.target.value);
  };

  // Veri türü değişimi
  const handleDataTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDataType(event.target.value as DataType);
  };

  // Önizleme tab değişimi
  const handlePreviewTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setPreviewTab(newValue);
  };

  // Dosya yükleme ve işleme
  const handleUpload = async () => {
    if (!selectedFile || !previewData || !currentProject) return;

    try {
      // Veriyi seçilen formata dönüştür
      const finalData = convertPreviewToFinalData(previewData, selectedDataType);
      
      // Yeni tab oluşturma veya mevcut taba ekleme
      if (tabOption === 'new' && newTabName.trim()) {
        // Yeni tab oluştur
        const tabName = newTabName.trim();
        
        // Tab adı kontrolü
        if (isTabExists(tabName)) {
          showSnackbar(`"${tabName}" kategorisi zaten mevcut. Lütfen farklı bir isim seçin.`, 'error');
          return;
        }
        
        const success = addTab(tabName);
        if (success) {
          updateProjectData(tabName, finalData);
          setActiveTab(tabName);
          showSnackbar(`Veriler yeni "${tabName}" kategorisine başarıyla yüklendi.`, 'success');
        } else {
          showSnackbar(`"${tabName}" kategorisi oluşturulamadı.`, 'error');
        }
      } else if (tabOption === 'existing' && selectedTab) {
        // Mevcut taba ekle
        updateProjectData(selectedTab, finalData);
        setActiveTab(selectedTab);
        showSnackbar(`Veriler "${getCategoryDisplayName(selectedTab)}" kategorisine başarıyla yüklendi.`, 'success');
      } else {
        showSnackbar('Lütfen bir kategori seçin veya yeni bir kategori adı girin.', 'error');
        return;
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      showSnackbar('Dosya işlenirken bir hata oluştu.', 'error');
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setSelectedTab('');
    setNewTabName('');
    setTabOption('existing');
    setSelectedDataType(DataType.UNKNOWN);
    setPreviewTab(0);
  };

  // Snackbar gösterme
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Dialog kapatma
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // Electron ile dosya seçme işleyicisi
  const handleSelectFile = async () => {
    setLoading(true);
    setError(null);
    setPreviewData(null);
    
    try {
      const result = await openExcelFile();
      
      if (!result || !result.success) {
        const errorMessage = result ? result.error : 'Dosya açılamadı';
        setError(errorMessage || 'Dosya açılamadı');
        return;
      }
      
      if (result.workbook) {
        await processFile(result.workbook);
      } else {
        setError('Excel dosyası okunamadı');
      }
    } catch (error: any) {
      console.error('Excel dosyası yüklenirken hata oluştu:', error);
      setError(`Excel dosyası yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop işlemleri
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Tüm tabları getir
  const tabs = getAllTabs();

  // Proje yüklenmemişse dosya yükleme alanını gösterme
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Excel Veri Yükleme
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box 
        sx={{ 
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
          borderRadius: 2,
          p: 3,
          backgroundColor: dragActive ? theme.palette.primary.light + '10' : theme.palette.grey[50],
          textAlign: 'center',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          mb: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 180
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={isElectron ? handleSelectFile : undefined}
      >
        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? theme.palette.primary.main : theme.palette.grey[500],
            mb: 2
          }} 
        />
        
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
          {isElectron 
            ? 'Tıklayarak Excel dosyası seçin veya dosyayı sürükleyip bırakın'
            : 'Dosyayı sürükleyip bırakın veya dosya seçmek için tıklayın'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Desteklenen formatlar: .xlsx, .xls, .csv
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<AttachFileIcon />}
          onClick={(e) => {
            e.stopPropagation();
            if (isElectron) {
              handleSelectFile();
            } else {
              document.getElementById('excel-file-input')?.click();
            }
          }}
          sx={{ mt: 2 }}
        >
          Dosya Seç
        </Button>
      </Box>
      
      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={() => document.getElementById('excel-file-input')?.click()}
        fullWidth
        sx={{ py: 1.2 }}
      >
        Dosya Seç
      </Button>

      {/* Veri Önizleme ve Yükleme Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Excel Verisi Önizleme ve Yükleme
        </DialogTitle>
        
        <DialogContent dividers>
          {previewData && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Veri Türü Seçimi
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: theme.palette.grey[50] }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Algılanan veri türü:
                    </Typography>
                    <Chip 
                      icon={previewData.type === DataType.TABLE ? <TableChartIcon /> : <ViewListIcon />}
                      label={previewData.type === DataType.TABLE ? "Tablo" : "Liste"} 
                      color="primary" 
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                </Paper>
                
                <RadioGroup
                  row
                  name="data-type"
                  value={selectedDataType}
                  onChange={handleDataTypeChange}
                >
                  <FormControlLabel 
                    value={DataType.TABLE} 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TableChartIcon sx={{ mr: 0.5, fontSize: 20 }} />
                        <Typography variant="body2">Tablo</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value={DataType.LIST} 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ViewListIcon sx={{ mr: 0.5, fontSize: 20 }} />
                        <Typography variant="body2">Liste</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Veri Önizleme
                </Typography>
                
                <Tabs 
                  value={previewTab} 
                  onChange={handlePreviewTabChange}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                >
                  <Tab label="Tablo Görünümü" />
                  <Tab label="JSON Görünümü" />
                </Tabs>
                
                {previewTab === 0 && (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {Object.keys(previewData.previewRows[0] || {}).map((header, index) => (
                            <TableCell key={index} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.previewRows.map((row, rowIndex) => (
                          <TableRow key={rowIndex} hover>
                            {Object.values(row).map((cell: any, cellIndex) => (
                              <TableCell key={cellIndex}>
                                {cell !== null && cell !== undefined ? String(cell) : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {previewTab === 1 && (
                  <Box 
                    component={Paper} 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      maxHeight: 300, 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      backgroundColor: theme.palette.grey[50]
                    }}
                  >
                    <pre>{JSON.stringify(convertPreviewToFinalData(previewData, selectedDataType), null, 2)}</pre>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Hedef Kategori Seçimi
                </Typography>
                
                <RadioGroup
                  name="tab-option"
                  value={tabOption}
                  onChange={handleTabOptionChange}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel 
                    value="existing" 
                    control={<Radio />} 
                    label="Mevcut bir kategoriye yükle" 
                    disabled={tabs.length === 0}
                  />
                  
                  {tabOption === 'existing' && (
                    <FormControl 
                      fullWidth 
                      variant="outlined" 
                      size="small" 
                      sx={{ ml: 4, mb: 2 }}
                      disabled={tabs.length === 0}
                    >
                      <InputLabel>Kategori Seç</InputLabel>
                      <Select
                        value={selectedTab}
                        onChange={handleTabChange as any}
                        label="Kategori Seç"
                      >
                        {tabs.map((tab) => (
                          <MenuItem key={tab} value={tab}>
                            {getCategoryDisplayName(tab)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  <FormControlLabel 
                    value="new" 
                    control={<Radio />} 
                    label="Yeni bir kategori oluştur" 
                  />
                  
                  {tabOption === 'new' && (
                    <TextField
                      label="Yeni Kategori Adı"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={newTabName}
                      onChange={handleNewTabNameChange}
                      sx={{ ml: 4, mb: 2 }}
                      helperText="Kategori adı boşluk içermemeli ve camelCase formatında olmalıdır."
                    />
                  )}
                </RadioGroup>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            color="primary"
            startIcon={<UploadFileIcon />}
            disabled={
              !previewData || 
              (tabOption === 'existing' && !selectedTab) || 
              (tabOption === 'new' && !newTabName.trim())
            }
          >
            Yükle
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
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Hata Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Yükleniyor Snackbar */}
      <Snackbar
        open={loading}
        message="Dosya yükleniyor..."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          variant="filled"
          severity="info"
          sx={{ width: '100%' }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Dosya yükleniyor...
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ExcelUploader;
