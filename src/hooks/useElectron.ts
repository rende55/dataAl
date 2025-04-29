import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

/**
 * Electron API'sini kullanmak için hook
 * Electron ortamında çalışıyorsa Electron API'sini, tarayıcıda çalışıyorsa tarayıcı API'sini kullanır
 */
export interface ElectronFileResult {
  success: boolean;
  filePath?: string;
  error?: string;
  workbook?: any;
  fileName?: string;
  buffer?: string;
  content?: string;
  data?: any;
  message?: string;
}

export const useElectron = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Electron ortamında çalışıp çalışmadığını kontrol et
  const isElectron = window.electronAPI !== undefined;

  // JSON dosyasını kaydet
  const saveJsonFile = useCallback(async (fileName: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const jsonContent = JSON.stringify(data, null, 2);

      if (isElectron) {
        // Electron API kullan
        const result = await window.electronAPI.saveFile({
          defaultPath: fileName,
          filters: [
            { name: 'JSON Dosyaları', extensions: ['json'] },
            { name: 'Tüm Dosyalar', extensions: ['*'] }
          ],
          content: jsonContent
        });

        if (!result.success) {
          throw new Error(result.message || 'Dosya kaydedilemedi');
        }

        return { success: true, filePath: result.filePath };
      } else {
        // Tarayıcı API kullan
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        return { success: true, filePath: fileName };
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // JSON dosyasını aç
  const openJsonFile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isElectron) {
        // Electron API kullan
        const result = await window.electronAPI.openFile({
          filters: [
            { name: 'JSON Dosyaları', extensions: ['json'] },
            { name: 'Tüm Dosyalar', extensions: ['*'] }
          ]
        });

        if (!result.success) {
          throw new Error(result.message || 'Dosya açılamadı');
        }

        return { 
          success: true, 
          filePath: result.filePath, 
          data: JSON.parse(result.content || '{}') 
        };
      } else {
        // Tarayıcı API kullan - input element oluştur
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) {
              resolve({ success: false, error: 'Dosya seçilmedi' });
              return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);
                resolve({ 
                  success: true, 
                  filePath: file.name, 
                  data 
                });
              } catch (err: any) {
                setError(err.message);
                resolve({ success: false, error: err.message });
              }
            };

            reader.onerror = () => {
              setError('Dosya okunamadı');
              resolve({ success: false, error: 'Dosya okunamadı' });
            };

            reader.readAsText(file);
          };

          input.click();
        });
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // Excel dosyasını aç
  const openExcelFile = useCallback(async (): Promise<ElectronFileResult> => {
    setLoading(true);
    setError(null);

    try {
      if (isElectron) {
        // Electron API kullan
        const result = await window.electronAPI.openExcelFile({});

        if (!result.success) {
          throw new Error(result.message || 'Excel dosyası açılamadı');
        }

        try {
          // Base64 buffer'ı binary array'e dönüştür
          const binaryString = atob(result.buffer || '');
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const workbook = XLSX.read(bytes, { type: 'array' });

          return { 
            success: true, 
            filePath: result.filePath,
            fileName: result.fileName,
            workbook
          };
        } catch (err: any) {
          console.error('Excel dosyası işlenirken hata:', err);
          throw new Error(`Excel dosyası işlenirken hata: ${err.message}`);
        }
      } else {
        // Tarayıcı API kullan - input element oluştur
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx,.xls,.csv';
          
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) {
              resolve({ success: false, error: 'Dosya seçilmedi' });
              return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                resolve({ 
                  success: true, 
                  filePath: file.name, 
                  fileName: file.name,
                  workbook
                });
              } catch (err: any) {
                setError(err.message);
                resolve({ success: false, error: err.message });
              }
            };

            reader.onerror = () => {
              setError('Dosya okunamadı');
              resolve({ success: false, error: 'Dosya okunamadı' });
            };

            reader.readAsBinaryString(file);
          };

          input.click();
        });
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // Uygulama bilgilerini al
  const getAppInfo = useCallback(() => {
    if (isElectron) {
      return {
        version: window.electronAPI.getAppVersion(),
        platform: window.electronAPI.getPlatform(),
        isElectron: true
      };
    } else {
      return {
        version: '1.0.0',
        platform: 'browser',
        isElectron: false
      };
    }
  }, [isElectron]);

  return {
    isElectron,
    loading,
    error,
    saveJsonFile,
    openJsonFile,
    openExcelFile,
    getAppInfo
  };
};

export default useElectron;
