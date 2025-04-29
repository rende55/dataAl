export interface ProjectInfo {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
}

export interface ProjectData {
  [key: string]: any[] | Record<string, any>;
}

export interface ProjectStructure {
  info: ProjectInfo;
  data: ProjectData;
}

export type TabCategory = string;

export interface TabItem {
  id: TabCategory;
  label: string;
  icon?: React.ReactNode;
}

export enum DataType {
  LIST = 'list',
  TABLE = 'table',
  NUMERIC = 'numeric',
  TEXT = 'text',
  DATE = 'date',
  UNKNOWN = 'unknown'
}

export interface ExcelPreviewData {
  raw: any[];
  type: DataType;
  headers: string[];
  rowHeaders?: string[];
  previewRows: any[];
}
