"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

interface EmailTemplate {
  id: string;
  templateId: string;
  subject: string;
  description?: string;
  updatedAt: string;
}

const fetchTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await fetch("/api/admin/email-templates");
  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }
  return response.json();
};

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[], Error>({
    queryKey: ["emailTemplates"],
    queryFn: fetchTemplates,
  });

  const handleCreateTemplate = (editorType: "simple" | "html") => {
    router.push(`/admin/email-templates/new?editor=${editorType}`);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-8 bg-white rounded-lg mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Create New Template
        </Button>
      </div>

      {/* Modal for Editor Selection */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Choose Editor</h2>
            <div className="flex flex-col space-y-4">
              <Button onClick={() => handleCreateTemplate("simple")}>
                Simple Editor
              </Button>
              <Button onClick={() => handleCreateTemplate("html")}>
                HTML Editor
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.templateId}</TableCell>
              <TableCell>{template.subject}</TableCell>
              <TableCell>{template.description || "-"}</TableCell>
              <TableCell>
                {new Date(template.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/admin/email-templates/${template.id}`)
                  }
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
