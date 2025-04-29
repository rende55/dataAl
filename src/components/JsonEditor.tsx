import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Snackbar, 
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useData } from '../context/DataContext';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';

const JsonEditor: React.FC = () => {
  const { data, saveToLocalStorage, downloadAsJson } = useData();
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isRawView, setIsRawView] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  // Snackbar gösterme
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Snackbar kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // LocalStorage'a kaydetme
  const handleSave = () => {
    setIsSaveDialogOpen(false);
    saveToLocalStorage();
    showSnackbar('Veriler başarıyla kaydedildi.', 'success');
  };

  // JSON olarak indirme
  const handleDownload = () => {
    setIsDownloadDialogOpen(false);
    downloadAsJson();
    showSnackbar('JSON dosyası indirildi.', 'success');
  };

  // Görünüm değiştirme
  const toggleView = () => {
    setIsRawView(!isRawView);
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          JSON Veri Görünümü
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={toggleView}
            sx={{ mr: 1 }}
          >
            {isRawView ? 'Düzenli Görünüm' : 'Ham JSON'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setIsSaveDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Kaydet
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setIsDownloadDialogOpen(true)}
          >
            JSON İndir
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          maxHeight: '500px',
          overflowY: 'auto',
          backgroundColor: isRawView ? '#272822' : 'background.paper',
          fontFamily: isRawView ? 'monospace' : 'inherit'
        }}
      >
        {isRawView ? (
          <pre style={{ color: '#f8f8f2', margin: 0 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <JsonView data={data} />
        )}
      </Paper>

      {/* Kaydetme Dialog */}
      <Dialog
        open={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
      >
        <DialogTitle>Verileri Kaydet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tüm değişiklikleri tarayıcı belleğine (LocalStorage) kaydetmek istediğinizden emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSaveDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* İndirme Dialog */}
      <Dialog
        open={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
      >
        <DialogTitle>JSON İndir</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tüm verileri JSON dosyası olarak indirmek istediğinizden emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDownloadDialogOpen(false)}>İptal</Button>
          <Button onClick={handleDownload} variant="contained">İndir</Button>
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

export default JsonEditor;
