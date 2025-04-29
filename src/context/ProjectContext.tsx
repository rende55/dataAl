import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ProjectStructure, ProjectInfo, ProjectData, TabCategory } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectContextType {
  projects: ProjectInfo[];
  currentProject: ProjectStructure | null;
  activeTab: TabCategory | null;
  setActiveTab: React.Dispatch<React.SetStateAction<TabCategory | null>>;
  createProject: (name: string) => ProjectStructure;
  loadProject: (id: string) => boolean;
  saveProject: () => boolean;
  updateProjectData: (tabName: TabCategory, data: any[] | Record<string, any>) => void;
  addTab: (tabName: string) => boolean;
  removeTab: (tabName: string) => boolean;
  getAllTabs: () => string[];
  downloadProjectAsJson: () => void;
  isTabExists: (tabName: string) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// LocalStorage anahtarları
const PROJECTS_KEY = 'dataal-projects';
const CURRENT_PROJECT_KEY = 'dataal-current-project';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectStructure | null>(null);
  const [activeTab, setActiveTab] = useState<TabCategory | null>(null);

  // LocalStorage'dan projeleri yükle
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    const savedCurrentProject = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (savedCurrentProject) {
      setCurrentProject(JSON.parse(savedCurrentProject));
    }
  }, []);

  // Yeni proje oluştur
  const createProject = (name: string): ProjectStructure => {
    const timestamp = new Date().toISOString();
    const newProjectInfo: ProjectInfo = {
      id: uuidv4(),
      name,
      createdAt: timestamp,
      lastModified: timestamp
    };

    const newProject: ProjectStructure = {
      info: newProjectInfo,
      data: {}
    };

    // Projeyi kaydet
    setProjects(prev => [...prev, newProjectInfo]);
    setCurrentProject(newProject);
    setActiveTab(null);

    // LocalStorage'a kaydet
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([...projects, newProjectInfo]));
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(newProject));

    return newProject;
  };

  // Projeyi yükle
  const loadProject = (id: string): boolean => {
    const projectInfo = projects.find(p => p.id === id);
    if (!projectInfo) return false;

    // LocalStorage'dan proje verilerini yükle
    const projectKey = `dataal-project-${id}`;
    const savedProject = localStorage.getItem(projectKey);
    
    if (savedProject) {
      const project: ProjectStructure = JSON.parse(savedProject);
      setCurrentProject(project);
      setActiveTab(null);
      localStorage.setItem(CURRENT_PROJECT_KEY, savedProject);
      return true;
    }
    
    // Eğer proje verisi yoksa, yeni bir proje yapısı oluştur
    const newProject: ProjectStructure = {
      info: projectInfo,
      data: {}
    };
    
    setCurrentProject(newProject);
    setActiveTab(null);
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(newProject));
    
    return true;
  };

  // Projeyi kaydet
  const saveProject = (): boolean => {
    if (!currentProject) return false;

    try {
      // Son güncelleme zamanını güncelle
      const updatedProject: ProjectStructure = {
        ...currentProject,
        info: {
          ...currentProject.info,
          lastModified: new Date().toISOString()
        }
      };
      
      // Projeyi güncelle
      setCurrentProject(updatedProject);
      
      // Proje listesini güncelle
      const updatedProjects = projects.map(p => 
        p.id === updatedProject.info.id 
          ? updatedProject.info 
          : p
      );
      
      setProjects(updatedProjects);
      
      // LocalStorage'a kaydet
      const projectKey = `dataal-project-${updatedProject.info.id}`;
      localStorage.setItem(projectKey, JSON.stringify(updatedProject));
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(updatedProject));
      
      return true;
    } catch (error) {
      console.error('Proje kaydedilemedi:', error);
      return false;
    }
  };

  // Proje verilerini güncelle
  const updateProjectData = (tabName: TabCategory, data: any[] | Record<string, any>) => {
    if (!currentProject) return;
    
    setCurrentProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        data: {
          ...prev.data,
          [tabName]: data
        }
      };
    });
  };

  // Yeni tab ekle
  const addTab = (tabName: string): boolean => {
    if (!currentProject) return false;
    if (!tabName.trim()) return false;
    if (currentProject.data[tabName] !== undefined) return false;
    
    setCurrentProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        data: {
          ...prev.data,
          [tabName]: [] // Başlangıçta boş bir dizi
        }
      };
    });
    
    return true;
  };

  // Tab sil
  const removeTab = (tabName: string): boolean => {
    if (!currentProject) return false;
    if (currentProject.data[tabName] === undefined) return false;
    
    setCurrentProject(prev => {
      if (!prev) return null;
      
      const newData = { ...prev.data };
      delete newData[tabName];
      
      return {
        ...prev,
        data: newData
      };
    });
    
    // Eğer aktif tab silinen tab ise, aktif tabı null yap
    if (activeTab === tabName) {
      setActiveTab(null);
    }
    
    return true;
  };

  // Tüm tabları getir
  const getAllTabs = (): string[] => {
    if (!currentProject) return [];
    return Object.keys(currentProject.data);
  };

  // Tab var mı kontrol et
  const isTabExists = (tabName: string): boolean => {
    if (!currentProject) return false;
    return currentProject.data[tabName] !== undefined;
  };

  // JSON dosyası olarak indir
  const downloadProjectAsJson = () => {
    if (!currentProject) return;
    
    try {
      const fileName = `data_${currentProject.info.name.replace(/\s+/g, '_')}.json`;
      const jsonString = JSON.stringify(currentProject.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      activeTab,
      setActiveTab,
      createProject,
      loadProject,
      saveProject,
      updateProjectData,
      addTab,
      removeTab,
      getAllTabs,
      downloadProjectAsJson,
      isTabExists
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject hook must be used within a ProjectProvider');
  }
  return context;
};
