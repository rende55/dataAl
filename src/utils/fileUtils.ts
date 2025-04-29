import * as XLSX from 'xlsx';
import { TabCategory, DataType, ExcelPreviewData } from '../types';

/**
 * Excel dosyasını JSON formatına dönüştürür ve veri türünü algılar
 * @param file Excel dosyası veya workbook nesnesi
 * @returns Excel önizleme verisi
 */
export const excelToPreview = async (file: File | any): Promise<ExcelPreviewData> => {
  return new Promise((resolve, reject) => {
    try {
      // Eğer doğrudan workbook nesnesi verilmişse
      if (file && file.SheetNames && file.Sheets) {
        try {
          const workbook = file;
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Boş satır ve sütunları temizle
          const cleanedData = cleanExcelData(jsonData as any[][]);
          
          // Veri türünü algıla
          const dataType = detectDataType(cleanedData);
          
          // Veri yapısını oluştur
          const previewData = createPreviewData(cleanedData, dataType);
          
          resolve(previewData);
        } catch (error: any) {
          console.error('Workbook işleme hatası:', error);
          reject(new Error(`Workbook işlenemedi: ${error.message}`));
        }
        return;
      }
      
      // Normal File nesnesi ise
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Boş satır ve sütunları temizle
          const cleanedData = cleanExcelData(jsonData as any[][]);
          
          // Veri türünü algıla
          const dataType = detectDataType(cleanedData);
          
          // Veri yapısını oluştur
          const previewData = createPreviewData(cleanedData, dataType);
          
          resolve(previewData);
        } catch (error: any) {
          console.error('Excel işleme hatası:', error);
          reject(new Error(`Excel dosyası işlenemedi: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Dosya okuma hatası:', error);
        reject(new Error('Dosya okunamadı'));
      };
      
      // File nesnesi kontrolü
      if (file instanceof File) {
        reader.readAsBinaryString(file);
      } else if (file && file.buffer) {
        // Electron API'den gelen buffer içeren nesne
        try {
          const workbook = XLSX.read(file.buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Boş satır ve sütunları temizle
          const cleanedData = cleanExcelData(jsonData as any[][]);
          
          // Veri türünü algıla
          const dataType = detectDataType(cleanedData);
          
          // Veri yapısını oluştur
          const previewData = createPreviewData(cleanedData, dataType);
          
          resolve(previewData);
        } catch (error: any) {
          console.error('Buffer işleme hatası:', error);
          reject(new Error(`Buffer işlenemedi: ${error.message}`));
        }
      } else {
        reject(new Error('Geçersiz dosya formatı'));
      }
    } catch (error: any) {
      console.error('Excel önizleme hatası:', error);
      reject(new Error(`Excel önizleme hatası: ${error.message}`));
    }
  });
};

/**
 * Excel verilerini temizler, boş satır ve sütunları kaldırır
 * @param data Excel verisi
 * @returns Temizlenmiş veri
 */
export const cleanExcelData = (data: any[][]): any[][] => {
  if (!data || data.length === 0) return [];
  
  // Boş satırları kaldır
  const rowsWithData = data.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
  
  if (rowsWithData.length === 0) return [];
  
  // Tüm satırların maksimum uzunluğunu bul
  const maxLength = Math.max(...rowsWithData.map(row => row.length));
  
  // Tüm satırları eşit uzunlukta yap
  const normalizedRows = rowsWithData.map(row => {
    const newRow = [...row];
    while (newRow.length < maxLength) {
      newRow.push(null);
    }
    return newRow;
  });
  
  return normalizedRows;
};

/**
 * Excel verilerinin türünü algılar
 * @param data Temizlenmiş Excel verisi
 * @returns Algılanan veri türü
 */
export const detectDataType = (data: any[][]): DataType => {
  if (!data || data.length < 2) return DataType.UNKNOWN;
  
  // İlk satır başlık olarak kabul edilir
  const headerRow = data[0];
  // Başlık satırını filtreleme (kullanılmıyor şu an)
  // const listHeader = headerRow.filter(h => h !== null && h !== undefined && h !== '');
  
  // Veri satırları
  const dataRows = data.slice(1);
  
  // Veri satırlarının en az %70'i sayısal mı kontrol et
  const numericRows = dataRows.filter(row => {
    return row.some((v: any) => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))));
  });
  
  const numericRatio = numericRows.length / dataRows.length;
  
  if (numericRatio >= 0.7) {
    return DataType.NUMERIC;
  }
  
  // Veri satırlarının en az %70'i tarih mi kontrol et
  const dateRows = dataRows.filter(row => {
    return row.some((cell: any, index: number) => {
      if (cell === null || cell === undefined || cell === '') return false;
      
      // Tarih olabilecek sütun başlıkları
      const dateHeaderKeywords = ['tarih', 'date', 'zaman', 'time', 'gün', 'day', 'ay', 'month', 'yıl', 'year'];
      const headerText = String(headerRow[index] || '').toLowerCase();
      const isDateHeader = dateHeaderKeywords.some(keyword => headerText.includes(keyword));
      
      // Değer tarih formatında mı?
      const isDateValue = typeof cell === 'string' && isDateString(cell);
      
      return isDateHeader || isDateValue;
    });
  });
  
  const dateRatio = dateRows.length / dataRows.length;
  
  if (dateRatio >= 0.7) {
    return DataType.DATE;
  }
  
  return DataType.TEXT;
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
  
  // Tek satır/sütunluk yapıyı kontrol et (liste olarak algıla)
  const isSingleRowOrColumn = 
    (data.length === 2 && data[0].length === 1) || // Tek sütun
    (data.length === 1 && data[0].length > 1);     // Tek satır
  
  if (dataType === DataType.LIST || isSingleRowOrColumn) {
    // Liste verisi
    const headers = data.length > 0 && data[0].length > 0 ? [String(data[0][0])] : ['Liste'];
    const values = data.length === 1 
      ? data[0].slice(1) // Yatay liste
      : data.slice(1).map(row => row[0]); // Dikey liste
    
    // Önizleme için değerleri dönüştür
    const previewValues = values.map(v => convertToTypedValue(v));
    
    return {
      raw: data,
      type: DataType.LIST,
      headers,
      previewRows: previewValues.map(v => ({ [headers[0]]: v })).slice(0, 5)
    };
  } else {
    // Tablo verisi (TABLE, NUMERIC, TEXT, DATE)
    // İlk satır sütun başlıklarını içerir (ilk hücre hariç)
    const headers = data[0].slice(1).map(h => String(h || 'Sütun'));
    // İlk sütun satır başlıklarını içerir (ilk satır hariç)
    const rowHeaders = data.slice(1).map(row => String(row[0] || 'Satır'));
    
    const previewRows: any[] = [];
    
    // En fazla 5 satır göster
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      // Satır başlığını ilk sütun olarak ekle
      const row: any = { 'Satır/Sütun': rowHeaders[i-1] };
      
      // Sütun başlıklarını kullanarak değerleri ekle
      for (let j = 0; j < headers.length; j++) {
        // j+1 kullanıyoruz çünkü ilk sütunu (satır başlığını) atladık
        const cellValue = data[i][j+1];
        // Değeri tipine göre dönüştür
        row[headers[j]] = convertToTypedValue(cellValue);
      }
      
      previewRows.push(row);
    }
    
    return {
      raw: data,
      type: dataType, // Algılanan veri türünü kullan
      headers,
      rowHeaders,
      previewRows
    };
  }
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
  const { raw } = previewData;
  
  // Veri kontrolü
  if (!raw || raw.length < 2 || raw[0].length < 2) {
    return {
      type: "tablo",
      x_labels: [],
      y_labels: [],
      data: {}
    };
  }
  
  // Tek satır/sütun kontrolü
  const isSingleRowOrColumn = 
    (raw.length === 2 && raw[0].length === 1) || // Tek sütun
    (raw.length === 1 && raw[0].length > 1);     // Tek satır
  
  // Küçük tablo kontrolü (2x2 veya 2x3 gibi)
  // Not: Bu değişken şu an kullanılmıyor, ancak ileride kullanıcıya sorma mantığı eklendiğinde kullanılacak
  const isSmallTable = raw.length <= 3 && raw[0].length <= 4 && !isSingleRowOrColumn;
  
  // Liste formatı (tek satır/sütun veya kullanıcı seçimi)
  if (selectedType === DataType.LIST || isSingleRowOrColumn) {
    let listHeader = '';
    let values: any[] = [];
    
    if (raw.length === 1 || (raw.length > 1 && raw[0].length === 1)) {
      // Yatay liste veya tek sütun
      listHeader = String(raw[0][0] || 'Liste');
      values = raw[0].length === 1 
        ? raw.slice(1).map(row => convertToTypedValue(row[0])) // Tek sütun
        : raw[0].slice(1).map(convertToTypedValue); // Yatay liste
    } else {
      // Varsayılan: ilk sütun başlık, ilk satır değerler
      listHeader = String(raw[0][0] || 'Liste');
      values = raw.slice(1).map(row => convertToTypedValue(row[0]));
    }
    
    // Boş değerleri null olarak işaretle
    values = values.map(v => v === undefined || v === '' ? null : v);
    
    // Liste formatı için JSON çıktısı
    const result = {
      [listHeader]: values
    };
    
    // JSON sarma formatı
    return {
      type: "liste",
      x_labels: values.map(v => String(v !== null ? v : '')),
      y_labels: [listHeader],
      data: result
    };
  } 
  // Tablo formatı (varsayılan ve diğer veri türleri)
  else {
    // İlk satır sütun başlıklarını içerir (ilk hücre hariç)
    const columnHeaders = raw[0].slice(1).map((header: any, index: number) => 
      header !== null && header !== undefined && header !== '' ? String(header) : `Sütun ${index + 1}`
    );
    
    // İlk sütun satır başlıklarını içerir (ilk satır hariç)
    const rowHeaders = raw.slice(1).map((row, index) => 
      row[0] !== null && row[0] !== undefined && row[0] !== '' ? String(row[0]) : `Satır ${index + 1}`
    );
    
    // Tablo verisi için iç içe objeler yapısı oluştur
    const tableData: Record<string, Record<string, any>> = {};
    
    // Her satır için işlem yap
    for (let i = 1; i < raw.length; i++) {
      // Satır başlığını al
      const rowKey = rowHeaders[i-1];
      
      // Bu satır için yeni bir nesne oluştur
      tableData[rowKey] = {};
      
      // Her sütun için değerleri ekle
      for (let j = 0; j < columnHeaders.length; j++) {
        const colKey = columnHeaders[j];
        const cellValue = raw[i][j+1]; // j+1 çünkü ilk sütunu atlıyoruz
        
        // Değeri tipine göre dönüştür ve ekle
        tableData[rowKey][colKey] = convertToTypedValue(cellValue);
      }
    }
    
    // JSON sarma formatı
    return {
      type: "tablo",
      x_labels: rowHeaders,
      y_labels: columnHeaders,
      data: tableData
    };
  }
};

/**
 * Değeri uygun tipine dönüştürür (sayı, tarih, vs.)
 * @param value Dönüştürülecek değer
 * @returns Dönüştürülmüş değer
 */
export const convertToTypedValue = (value: any): any => {
  // Boş değer kontrolü
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  // Sayı kontrolü
  if (typeof value === 'number') {
    return value; // Zaten sayı
  }
  
  if (typeof value === 'string') {
    // Sayı olabilir mi?
    const numberValue = Number(value.replace(',', '.'));
    if (!isNaN(numberValue)) {
      return numberValue;
    }
    
    // Tarih olabilir mi?
    if (isDateString(value)) {
      // Tarih olarak döndürmek yerine string olarak bırak
      return value;
    }
    
    // Normal string
    return value;
  }
  
  // Diğer tipler için olduğu gibi döndür
  return value;
};

/**
 * Dosya uzantısının geçerli olup olmadığını kontrol eder
 * @param file Kontrol edilecek dosya
 * @returns Geçerli ise true, değilse false
 */
export const isValidFileExtension = (file: File | any): boolean => {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  
  // File nesnesi veya dosya yolu/adı kontrolü
  if (!file) return false;
  
  // Dosya adını al (File nesnesi veya string olabilir)
  let fileName = '';
  
  if (typeof file === 'string') {
    // Doğrudan dosya yolu/adı verilmişse
    fileName = file.toLowerCase();
  } else if (file.name) {
    // Standart File nesnesi
    fileName = file.name.toLowerCase();
  } else if (file.fileName) {
    // Electron API'den gelen nesne
    fileName = file.fileName.toLowerCase();
  } else if (file.filePath) {
    // Electron API'den gelen nesne (yol bilgisi)
    const pathParts = file.filePath.split(/[\/\\]/);
    fileName = pathParts[pathParts.length - 1].toLowerCase();
  } else {
    // Hiçbir şekilde dosya adı alınamadı
    return false;
  }
  
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

/**
 * Bir string'in tarih formatında olup olmadığını kontrol eder
 * @param value Kontrol edilecek değer
 * @returns Tarih formatında ise true, değilse false
 */
export const isDateString = (value: string): boolean => {
  if (!value) return false;
  
  // Tarih formatları
  const datePatterns = [
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    /^\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
    /^\d{1,2}\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s+\d{2,4}$/, // DD Ay YYYY
    /^[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s+\d{1,2},?\s+\d{2,4}$/ // Ay DD, YYYY
  ];
  
  // Herhangi bir tarih formatına uyuyorsa true döndür
  if (datePatterns.some(pattern => pattern.test(value))) {
    return true;
  }
  
  // Date.parse ile geçerli bir tarih mi kontrol et
  const timestamp = Date.parse(value);
  return !isNaN(timestamp);
};
