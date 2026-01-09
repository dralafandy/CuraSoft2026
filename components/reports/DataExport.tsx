import React from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataExportProps {
  data: any[];
  filename: string;
  title: string;
  columns: { key: string; title: string }[];
  onExport?: (format: string) => void;
}

const DataExport: React.FC<DataExportProps> = ({
  data,
  filename,
  title,
  columns,
  onExport
}) => {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    onExport?.('excel');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    // Prepare data for PDF
    const tableColumn = columns.map(col => col.title);
    const tableRows = data.map(item => 
      columns.map(col => item[col.key] || '')
    );

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 11
      }
    });

    doc.save(`${filename}.pdf`);
    onExport?.('pdf');
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.title).join(',');
    const rows = data.map(item => 
      columns.map(col => `"${item[col.key] || ''}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onExport?.('csv');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportToExcel}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        📊 Excel
      </button>
      <button
        onClick={exportToPDF}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
      >
        📄 PDF
      </button>
      <button
        onClick={exportToCSV}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        📋 CSV
      </button>
    </div>
  );
};

export default DataExport;