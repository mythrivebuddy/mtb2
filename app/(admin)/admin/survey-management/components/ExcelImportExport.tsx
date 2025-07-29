'use client';

import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ExcelImportExport() {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const categories = XLSX.utils.sheet_to_json(workbook.Sheets['Categories']);
      const questions = XLSX.utils.sheet_to_json(workbook.Sheets['Questions']);
      console.log('Imported Excel:', { categories, questions });
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Survey Data from Excel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept=".xlsx,.xls" onChange={handleImport} />
      </CardContent>
    </Card>
  );
}
