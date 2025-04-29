import * as XLSX from 'xlsx';
import { TabCategory, DataType, ExcelPreviewData } from '../types';

/**
 * Excel dosyasını JSON formatına dönüştürür ve veri türünü algılar
 * @param file Excel dosyası
 * @returns Excel önizleme verisi
 */
export const excelToPreview = async (file: File): Promise<ExcelPreviewData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Boş satır ve sütunları temizle
        const cleanedData = cleanExcelData(jsonData);
        
        // Veri türünü algıla
        const dataType = detectDataType(cleanedData);
        
        // Veri yapısını oluştur
        const previewData = createPreviewData(cleanedData, dataType);
        
        resolve(previewData);
      } catch (error) {
        reject(new Error('Excel dosyası işlenemedi'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Excel verilerini temizler (boş satır ve sütunları kaldırır)
 * @param data Ham Excel verileri
 * @returns Temizlenmiş veriler
 */
const cleanExcelData = (data: any[][]): any[][] => {
  // Boş satırları kaldır
  const rowsWithData = data.filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
  
  if (rowsWithData.length === 0) return [];
  
  // Boş sütunları bul
  const maxCols = Math.max(...rowsWithData.map(row => row.length));
  const emptyCols: boolean[] = Array(maxCols).fill(true);
  
  rowsWithData.forEach(row => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== undefined && row[i] !== null && row[i] !== '') {
        emptyCols[i] = false;
      }
    }
  });
  
  // Boş sütunları kaldır
  return rowsWithData.map(row => {
    const newRow: any[] = [];
    for (let i = 0; i < row.length; i++) {
      if (!emptyCols[i]) {
        newRow.push(row[i] !== undefined ? row[i] : '');
      }
    }
    return newRow;
  });
};

/**
 * Excel verilerinin türünü algılar (liste veya tablo)
 * @param data Temizlenmiş Excel verileri
 * @returns Veri türü
 */
const detectDataType = (data: any[][]): DataType => {
  if (data.length === 0) return DataType.UNKNOWN;
  
  // Tek satır veya tek sütun ise liste
  if (data.length === 1 || (data.every(row => row.length === 1))) {
    return DataType.LIST;
  }
  
  // Birden fazla satır ve sütun varsa tablo
  if (data.length > 1 && data[0].length > 1) {
    return DataType.TABLE;
  }
  
  return DataType.UNKNOWN;
};

/**
 * Excel verilerini önizleme formatına dönüştürür
 * @param data Temizlenmiş Excel verileri
 * @param dataType Algılanan veri türü
 * @returns Önizleme verisi
 */
const createPreviewData = (data: any[][], dataType: DataType): ExcelPreviewData => {
  if (data.length === 0) {
    return {
      raw: [],
      type: DataType.UNKNOWN,
      headers: [],
      previewRows: []
    };
  }
  
  if (dataType === DataType.LIST) {
    // Liste verisi
    const headers = data.length > 0 && data[0].length > 0 ? [String(data[0][0])] : ['Liste'];
    const values = data.length === 1 
      ? data[0].slice(1) // Yatay liste
      : data.slice(1).map(row => row[0]); // Dikey liste
    
    return {
      raw: data,
      type: DataType.LIST,
      headers,
      previewRows: values.map(v => ({ [headers[0]]: v })).slice(0, 5)
    };
  } else if (dataType === DataType.TABLE) {
    // Tablo verisi
    const headers = data[0].slice(1).map(h => String(h || 'Sütun'));
    const rowHeaders = data.slice(1).map(row => String(row[0] || 'Satır'));
    
    const previewRows: any[] = [];
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      const row: any = { 'Satır/Sütun': rowHeaders[i-1] };
      for (let j = 1; j < data[i].length; j++) {
        row[headers[j-1]] = data[i][j];
      }
      previewRows.push(row);
    }
    
    return {
      raw: data,
      type: DataType.TABLE,
      headers,
      rowHeaders,
      previewRows
    };
  }
  
  // Bilinmeyen veri türü
  return {
    raw: data,
    type: DataType.UNKNOWN,
    headers: data[0]?.map(h => String(h || 'Sütun')) || [],
    previewRows: data.slice(1, 6).map(row => {
      const obj: any = {};
      row.forEach((cell, index) => {
        obj[`Sütun ${index + 1}`] = cell;
      });
      return obj;
    })
  };
};

/**
 * Önizleme verisini seçilen formata dönüştürür
 * @param previewData Önizleme verisi
 * @param selectedType Seçilen veri türü
 * @returns Dönüştürülmüş veri
 */
export const convertPreviewToFinalData = (
  previewData: ExcelPreviewData, 
  selectedType: DataType
): any[] | Record<string, any> => {
  const { raw, headers, rowHeaders } = previewData;
  
  if (selectedType === DataType.LIST) {
    // Liste formatına dönüştür
    const listHeader = headers[0] || 'Liste';
    const values = previewData.type === DataType.LIST
      ? (raw.length === 1 ? raw[0].slice(1) : raw.slice(1).map(row => row[0]))
      : raw.slice(1).map(row => row[1]); // Tablodan listeye dönüştürme
    
    return values.filter(v => v !== undefined && v !== null && v !== '');
  } else if (selectedType === DataType.TABLE) {
    // Tablo formatına dönüştür
    if (!rowHeaders || rowHeaders.length === 0) return {};
    
    const result: Record<string, Record<string, any>> = {};
    
    for (let i = 1; i < raw.length; i++) {
      const rowKey = String(raw[i][0] || `Satır ${i}`);
      result[rowKey] = {};
      
      for (let j = 1; j < raw[i].length && j <= headers.length; j++) {
        const colKey = String(raw[0][j] || `Sütun ${j}`);
        result[rowKey][colKey] = raw[i][j];
      }
    }
    
    return result;
  }
  
  // Varsayılan olarak düz bir dizi döndür
  return raw.slice(1).map(row => {
    const obj: any = {};
    row.forEach((cell, index) => {
      obj[String(raw[0][index] || `Sütun ${index + 1}`)] = cell;
    });
    return obj;
  });
};

/**
 * Dosya uzantısının geçerli olup olmadığını kontrol eder
 * @param file Kontrol edilecek dosya
 * @returns Geçerli ise true, değilse false
 */
export const isValidFileExtension = (file: File): boolean => {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Kategori adını insan tarafından okunabilir formata dönüştürür
 * @param category Kategori anahtarı
 * @returns İnsan tarafından okunabilir kategori adı
 */
export const getCategoryDisplayName = (category: TabCategory): string => {
  // Sabit kategori isimleri
  const displayNames: Record<string, string> = {
    yapiSiniflari: 'Yapı Sınıfları',
    birimFiyatlar: 'Birim Fiyatlar',
    binaYasGruplari: 'Bina Yaş Grupları',
    yapiTeknikleri: 'Yapı Teknikleri',
    mevzuatlar: 'Mevzuatlar',
    guncelBilgiler: 'Güncel Bilgiler'
  };
  
  // Eğer sabit kategorilerden biriyse, karşılık gelen ismi döndür
  if (displayNames[category]) {
    return displayNames[category];
  }
  
  // Eğer özel bir kategori ise, camelCase'den insan tarafından okunabilir formata dönüştür
  // Örnek: "yeniKategori" -> "Yeni Kategori"
  return category
    // İlk harfi büyük yap
    .replace(/^[a-z]/, (match: string) => match.toUpperCase())
    // Büyük harflerin önüne boşluk ekle
    .replace(/([A-Z])/g, ' $1')
    // Fazla boşlukları temizle
    .trim();
};
