"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

type ExcelRow = {
  Category?: string;
  Question?: string;
  Options?: string;
  MultiSelect?: string | boolean;
};

export function ExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        toast.error("Invalid file type. Please upload an .xlsx file.");
        return;
      }
      setFile(selectedFile);
    }
  };
const handleImport = async () => {
  if (!file) {
    toast.warning("Please select a file to import.");
    return;
  }

  setIsImporting(true);
  toast.info("Reading file...");

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });

    const categoriesSet = new Set<string>();
    const questions = jsonData.map((row: ExcelRow) => {
      const categoryName = row.Category?.trim();
      categoriesSet.add(categoryName || "");

      return {
        text: row.Question?.trim(),
        options: row.Options?.trim(),
        isMultiSelect:
          row.MultiSelect === "TRUE" || row.MultiSelect === true,
        categoryName,
      };
    });

    const categories = Array.from(categoriesSet).map((name) => ({ name }));

    // ✅ Save to localStorage
    localStorage.setItem("imported_categories", JSON.stringify(categories));
    localStorage.setItem("imported_questions", JSON.stringify(questions));

    toast.success("Data saved to local storage ✅");
    setFile(null); // reset
  } catch (err: unknown) {
    console.error("Import error:", err);
    toast.error("Failed to import Excel file.");
  }

  setIsImporting(false);
};


  return (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <label
        htmlFor="excel-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center transition-colors hover:bg-muted/50"
      >
        <Upload className="h-10 w-10 text-muted-foreground/80" />
        <p className="font-semibold text-foreground">Click to upload file</p>
        <p className="text-xs text-muted-foreground">
          or drag and drop (.xlsx)
        </p>
      </label>
      <input
        id="excel-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />

      {/* File preview */}
      {file && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Import button */}
      <Button onClick={handleImport} disabled={!file || isImporting}>
        {isImporting ? "Importing..." : "Import Data"}
      </Button>
    </div>
  );
}
