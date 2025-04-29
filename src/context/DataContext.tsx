import React, { createContext, useState, useContext, ReactNode } from 'react';
import { DataStructure, DataCategory } from '../types';

// Varsayılan boş veri yapısı
const defaultData: DataStructure = {
  yapiSiniflari: [],
  birimFiyatlar: [],
  binaYasGruplari: [],
  yapiTeknikleri: [],
  mevzuatlar: [],
  guncelBilgiler: []
};

interface DataContextType {
  data: DataStructure;
  setData: React.Dispatch<React.SetStateAction<DataStructure>>;
  updateCategory: (category: DataCategory, newData: any[]) => void;
  activeTab: DataCategory;
  setActiveTab: React.Dispatch<React.SetStateAction<DataCategory>>;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  downloadAsJson: () => void;
  addNewCategory: (categoryName: string) => boolean;
  removeCategory: (categoryName: string) => boolean;
  getAllCategories: () => string[];
  isCategoryExists: (categoryName: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataStructure>(defaultData);
  const [activeTab, setActiveTab] = useState<DataCategory>('yapiSiniflari');

  // Belirli bir kategoriyi güncelle
  const updateCategory = (category: DataCategory, newData: any[]) => {
    setData(prevData => ({
      ...prevData,
      [category]: newData
    }));
  };

  // Yeni kategori ekle
  const addNewCategory = (categoryName: string): boolean => {
    // Kategori adı boş olamaz
    if (!categoryName.trim()) return false;
    
    // Kategori zaten varsa ekleme
    if (data[categoryName] !== undefined) return false;
    
    setData(prevData => ({
      ...prevData,
      [categoryName]: []
    }));
    
    return true;
  };
  
  // Kategori sil
  const removeCategory = (categoryName: string): boolean => {
    // Varsayılan kategorileri silmeye izin verme
    if (Object.keys(defaultData).includes(categoryName)) return false;
    
    // Kategori yoksa silme
    if (data[categoryName] === undefined) return false;
    
    setData(prevData => {
      const newData = { ...prevData };
      delete newData[categoryName];
      return newData;
    });
    
    // Eğer aktif tab silinen kategoriyse, varsayılan bir taba geç
    if (activeTab === categoryName) {
      setActiveTab('yapiSiniflari');
    }
    
    return true;
  };
  
  // Tüm kategorileri getir
  const getAllCategories = (): string[] => {
    return Object.keys(data);
  };
  
  // Kategori var mı kontrol et
  const isCategoryExists = (categoryName: string): boolean => {
    return data[categoryName] !== undefined;
  };

  // LocalStorage'a kaydet
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('dataal-json', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Veri kaydedilemedi:', error);
      return false;
    }
  };

  // LocalStorage'dan yükle
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('dataal-json');
      if (savedData) {
        setData(JSON.parse(savedData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
      return false;
    }
  };

  // JSON dosyası olarak indir
  const downloadAsJson = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      
      // Temizlik
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON dosyası indirilemedi:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      data,
      setData,
      updateCategory,
      activeTab,
      setActiveTab,
      saveToLocalStorage,
      loadFromLocalStorage,
      downloadAsJson,
      addNewCategory,
      removeCategory,
      getAllCategories,
      isCategoryExists
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData hook must be used within a DataProvider');
  }
  return context;
};
