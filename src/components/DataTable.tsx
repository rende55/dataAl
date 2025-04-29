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
  TextField
} from '@mui/material';
import { DataGrid, GridColDef, GridCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useData } from '../context/DataContext';
import { getCategoryDisplayName } from '../utils/fileUtils';

const DataTable: React.FC = () => {
  const { data, activeTab, updateCategory } = useData();
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [newRow, setNewRow] = useState<Record<string, any>>({});

  // Veri değiştiğinde veya tab değiştiğinde tabloyu güncelle
  useEffect(() => {
    const activeData = data[activeTab] || [];
    
    if (activeData.length > 0) {
      // Tablo sütunlarını oluştur
      const firstItem = activeData[0];
      const cols: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 }
      ];
      
      // Veri özelliklerinden sütunlar oluştur
      Object.keys(firstItem).forEach(key => {
        cols.push({
          field: key,
          headerName: key.charAt(0).toUpperCase() + key.slice(1),
          width: 150,
          editable: false,
        });
      });
      
      // İşlem sütunu ekle
      cols.push({
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
      });
      
      setColumns(cols);
      
      // Satırları oluştur (id ekleyerek)
      const rowsWithId = activeData.map((item, index) => ({
        id: index + 1,
        ...item
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
  }, [data, activeTab]);

  // Düzenleme işlemi
  const handleEditClick = (row: any) => {
    setCurrentRow(row);
    
    // Düzenlenecek değerleri ayarla (id ve actions hariç)
    const values: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      if (key !== 'id' && key !== 'actions') {
        values[key] = row[key];
      }
    });
    
    setEditedValues(values);
    setIsEditDialogOpen(true);
  };

  // Silme işlemi
  const handleDeleteClick = (row: any) => {
    setCurrentRow(row);
    setIsDeleteDialogOpen(true);
  };

  // Ekleme işlemi
  const handleAddClick = () => {
    if (rows.length > 0 && rows[0].message !== 'Bu kategoride henüz veri yok.') {
      // İlk satırdan şablonu al (id ve actions hariç)
      const template: Record<string, any> = {};
      Object.keys(rows[0]).forEach(key => {
        if (key !== 'id' && key !== 'actions') {
          template[key] = '';
        }
      });
      setNewRow(template);
    } else {
      // Boş bir şablon oluştur
      setNewRow({ ornek: '' });
    }
    
    setIsAddDialogOpen(true);
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

  // Düzenlemeyi kaydet
  const handleSaveEdit = () => {
    if (!currentRow) return;
    
    const updatedRows = rows.map(row => {
      if (row.id === currentRow.id) {
        return { ...row, ...editedValues };
      }
      return row;
    });
    
    // ID'leri çıkararak veriyi güncelle
    const dataToSave = updatedRows.map(({ id, ...rest }) => rest);
    updateCategory(activeTab, dataToSave);
    
    setIsEditDialogOpen(false);
  };

  // Silmeyi onayla
  const handleConfirmDelete = () => {
    if (!currentRow) return;
    
    const updatedRows = rows.filter(row => row.id !== currentRow.id);
    
    // ID'leri çıkararak veriyi güncelle
    const dataToSave = updatedRows.map(({ id, ...rest }) => rest);
    updateCategory(activeTab, dataToSave);
    
    setIsDeleteDialogOpen(false);
  };

  // Yeni satır ekle
  const handleAddRow = () => {
    // Mevcut veriler varsa
    if (rows.length > 0 && rows[0].message !== 'Bu kategoride henüz veri yok.') {
      const newId = Math.max(...rows.map(r => r.id)) + 1;
      const newRowWithId = { id: newId, ...newRow };
      const updatedRows = [...rows, newRowWithId];
      
      // ID'leri çıkararak veriyi güncelle
      const dataToSave = updatedRows.map(({ id, ...rest }) => rest);
      updateCategory(activeTab, dataToSave);
    } else {
      // İlk veri ekleniyor
      const newRowWithId = { id: 1, ...newRow };
      const updatedRows = [newRowWithId];
      
      // ID'leri çıkararak veriyi güncelle
      const dataToSave = updatedRows.map(({ id, ...rest }) => rest);
      updateCategory(activeTab, dataToSave);
    }
    
    setIsAddDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {getCategoryDisplayName(activeTab)} Verileri
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Yeni Ekle
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },
          }}
        />
      </Paper>

      {/* Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Veri Düzenle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Aşağıdaki alanları düzenleyebilirsiniz:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {Object.keys(editedValues).map((field) => (
              <TextField
                key={field}
                margin="dense"
                label={field}
                type="text"
                fullWidth
                variant="outlined"
                value={editedValues[field] || ''}
                onChange={(e) => handleEditChange(field, e.target.value)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSaveEdit} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Veriyi Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu veriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>İptal</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>

      {/* Ekleme Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Yeni Veri Ekle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Yeni veri için aşağıdaki alanları doldurun:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {Object.keys(newRow).map((field) => (
              <TextField
                key={field}
                margin="dense"
                label={field}
                type="text"
                fullWidth
                variant="outlined"
                value={newRow[field] || ''}
                onChange={(e) => handleNewRowChange(field, e.target.value)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
          <Button onClick={handleAddRow} variant="contained">Ekle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataTable;
