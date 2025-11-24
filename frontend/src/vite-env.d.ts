/// <reference types="vite/client" />

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number[];
      fontStyle?: string;
      fontSize?: number;
    };
    bodyStyles?: {
      textColor?: number[];
      fontSize?: number;
    };
    alternateRowStyles?: {
      fillColor?: number[];
    };
    styles?: {
      cellPadding?: number;
      fontSize?: number;
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number;
      };
    };
  }
  
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
  
  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}
