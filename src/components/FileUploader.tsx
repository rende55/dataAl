import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
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
  Radio
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useData } from '../context/DataContext';
import { excelToJson, isValidFileExtension, getCategoryDisplayName } from '../utils/fileUtils';
import { DataCategory } from '../types';

const FileUploader: React.FC = () => {
  const { updateCategory, getAllCategories, addNewCategory, setActiveTab } = useData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('yapiSiniflari');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryOption, setCategoryOption] = useState('existing'); // 'existing' veya 'new'
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [dragActive, setDragActive] = useState(false);

  // Dosya seçimi
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (isValidFileExtension(file)) {
        setSelectedFile(file);
        try {
          // Dosyayı önizleme için yükle
          const jsonData = await excelToJson(file);
          setPreviewData(jsonData.slice(0, 5)); // İlk 5 satırı önizleme için al
          setIsDialogOpen(true);
        } catch (error) {
          showSnackbar('Dosya işlenirken bir hata oluştu.', 'error');
        }
      } else {
        showSnackbar('Lütfen geçerli bir Excel veya CSV dosyası seçin.', 'error');
      }
    }
  };

  // Kategori seçimi
  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value as DataCategory);
  };

  // Yeni kategori adı değişimi
  const handleNewCategoryNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(event.target.value);
  };

  // Kategori seçeneği değişimi
  const handleCategoryOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryOption(event.target.value);
  };

  // Dosya yükleme ve işleme
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const jsonData = await excelToJson(selectedFile);
      
      // Yeni kategori oluşturma veya mevcut kategoriye ekleme
      if (categoryOption === 'new' && newCategoryName.trim()) {
        // Yeni kategori oluştur
        const success = addNewCategory(newCategoryName.trim());
        if (success) {
          updateCategory(newCategoryName.trim(), jsonData);
          setActiveTab(newCategoryName.trim());
          showSnackbar(`Veriler yeni "${newCategoryName.trim()}" kategorisine başarıyla yüklendi.`, 'success');
        } else {
          showSnackbar(`"${newCategoryName.trim()}" kategorisi zaten mevcut veya geçersiz bir isim.`, 'error');
        }
      } else {
        // Mevcut kategoriye ekle
        updateCategory(selectedCategory, jsonData);
        setActiveTab(selectedCategory);
        showSnackbar(`Veriler "${getCategoryDisplayName(selectedCategory)}" kategorisine başarıyla yüklendi.`, 'success');
      }
      
      setIsDialogOpen(false);
      setSelectedFile(null);
      setNewCategoryName('');
      setCategoryOption('existing');
      setPreviewData([]);
    } catch (error) {
      showSnackbar('Dosya işlenirken bir hata oluştu.', 'error');
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

  // Dialog kapatma
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setNewCategoryName('');
    setCategoryOption('existing');
    setPreviewData([]);
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
      const file = e.dataTransfer.files[0];
      if (isValidFileExtension(file)) {
        setSelectedFile(file);
        try {
          // Dosyayı önizleme için yükle
          const jsonData = await excelToJson(file);
          setPreviewData(jsonData.slice(0, 5)); // İlk 5 satırı önizleme için al
          setIsDialogOpen(true);
        } catch (error) {
          showSnackbar('Dosya işlenirken bir hata oluştu.', 'error');
        }
      } else {
        showSnackbar('Lütfen geçerli bir Excel veya CSV dosyası seçin.', 'error');
      }
    }
  };

  // Tüm kategorileri al
  const categories = getAllCategories();

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          transition: 'all 0.3s ease',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Box sx={{ textAlign: 'center' }}>
          <input
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadFileIcon />}
              sx={{ mb: 2 }}
            >
              Excel Dosyası Seç
            </Button>
          </label>
          <Typography variant="body2" color="text.secondary">
            veya dosyayı buraya sürükleyip bırakın
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Desteklenen formatlar: .xlsx, .xls, .csv
          </Typography>
        </Box>
      </Paper>

      {/* Kategori Seçme ve Önizleme Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Excel Verisi Önizleme ve Kategori Seçimi</DialogTitle>
        <DialogContent>
          {/* Veri Önizleme */}
          {previewData.length > 0 && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Veri Önizleme (İlk 5 satır):
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          <DialogContentText sx={{ mb: 2 }}>
            {selectedFile?.name} dosyasındaki verileri nereye aktarmak istiyorsunuz?
          </DialogContentText>
          
          {/* Kategori Seçimi */}
          <RadioGroup
            value={categoryOption}
            onChange={handleCategoryOptionChange}
            sx={{ mb: 2 }}
          >
            <FormControlLabel 
              value="existing" 
              control={<Radio />} 
              label="Mevcut bir kategoriye ekle" 
            />
            <FormControlLabel 
              value="new" 
              control={<Radio />} 
              label="Yeni bir kategori oluştur" 
            />
          </RadioGroup>
          
          {/* Mevcut Kategori Seçimi */}
          {categoryOption === 'existing' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="category-select-label">Kategori</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                label="Kategori"
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Yeni Kategori Adı Girişi */}
          {categoryOption === 'new' && (
            <TextField
              fullWidth
              label="Yeni Kategori Adı"
              variant="outlined"
              value={newCategoryName}
              onChange={handleNewCategoryNameChange}
              sx={{ mb: 2 }}
              placeholder="Örn: yeniKategori"
              helperText="Kategori adı boşluk içermemeli ve camelCase formatında olmalıdır."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={(categoryOption === 'new' && !newCategoryName.trim()) || !selectedFile}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FileUploader;
