const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Pencere referansını global olarak tut (GC tarafından silinmesini önlemek için)
let mainWindow;

// Ana pencereyi oluştur
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // Hazır olana kadar gösterme
    backgroundColor: '#f5f5f5',
    title: 'DataAL Panel',
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Hazır olduğunda göster (beyaz ekran yanıp sönmesini önlemek için)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // DevTools'u sadece --dev parametresi ile açılırsa aç
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Uygulamayı yükle - Her zaman dist klasöründen yükle
  const startUrl = url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);
  console.log(`Uygulama başlatılıyor: ${startUrl}`);

  // Pencere kapatıldığında referansı temizle
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron hazır olduğunda pencereyi oluştur
app.whenReady().then(() => {
  createWindow();

  // macOS'ta uygulama dock'ta olduğunda yeni pencere oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamadan çık (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC İşleyicileri (Inter-Process Communication)

// JSON dosyasını kaydet
ipcMain.handle('save-file', async (event, args) => {
  try {
    const { defaultPath, filters, content } = args;
    
    // Dosya kaydetme dialogunu göster
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: filters || [
        { name: 'JSON Dosyaları', extensions: ['json'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    if (canceled || !filePath) {
      return { success: false, message: 'Dosya kaydetme işlemi iptal edildi' };
    }
    
    // Dosyayı kaydet
    fs.writeFileSync(filePath, content, 'utf-8');
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Dosya kaydetme hatası:', error);
    return { success: false, message: error.message };
  }
});

// JSON dosyasını aç
ipcMain.handle('open-file', async (event, args) => {
  try {
    const { filters } = args;
    
    // Dosya açma dialogunu göster
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: filters || [
        { name: 'JSON Dosyaları', extensions: ['json'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Dosya açma işlemi iptal edildi' };
    }
    
    // Dosyayı oku
    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return { success: true, filePath, content };
  } catch (error) {
    console.error('Dosya açma hatası:', error);
    return { success: false, message: error.message };
  }
});

// Excel dosyasını aç
ipcMain.handle('open-excel-file', async (event, args) => {
  try {
    const { filters } = args;
    
    // Dosya açma dialogunu göster
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: filters || [
        { name: 'Excel Dosyaları', extensions: ['xlsx', 'xls', 'csv'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Excel dosyası açma işlemi iptal edildi' };
    }
    
    // Dosyayı oku
    const filePath = filePaths[0];
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Buffer'ı base64'e dönüştür
    const base64 = buffer.toString('base64');
    
    return { 
      success: true, 
      filePath, 
      fileName,
      buffer: base64
    };
  } catch (error) {
    console.error('Excel dosyası açma hatası:', error);
    return { success: false, message: error.message };
  }
});
