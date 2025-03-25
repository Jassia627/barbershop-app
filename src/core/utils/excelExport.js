import * as XLSX from 'xlsx';

/**
 * Exporta datos a un archivo Excel
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {string} fileName - Nombre del archivo sin extensión
 */
export const exportToExcel = (data, fileName = 'export') => {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Convertir los datos a una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Guardar el archivo
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw new Error('No se pudo exportar el archivo Excel');
  }
}; 