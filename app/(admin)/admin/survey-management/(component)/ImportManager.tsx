"use client";

import { ExcelImport } from "@/components/adminDashboard/ExcelImport";

export function ImportManager() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload Excel File</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload an Excel (.xlsx) file with two sheets named &quot;Categories&quot; and &quot;Questions&quot; to add data in bulk.
        </p>
        <ExcelImport />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">File Format Instructions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-800">&quot;Categories&quot; Sheet</h3>
            <p className="text-gray-600">This sheet should have one column with the header <code>name</code>.</p>
            <pre className="bg-gray-100 p-2 rounded-md mt-1 text-xs">{`name
Goals & Planning
Marketing Challenges`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">&quot;Questions&quot; Sheet</h3>
            <p className="text-gray-600">This sheet needs three columns: <code>text</code>, <code>options</code>, and <code>categoryName</code>.</p>
            <p className="text-gray-600 mt-1">Separate multiple options with a semicolon (<code>;</code>).</p>
            <pre className="bg-gray-100 p-2 rounded-md mt-1 text-xs">{`text | options | categoryName
What are your goals? | Increase revenue;Improve retention | Goals & Planning`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
