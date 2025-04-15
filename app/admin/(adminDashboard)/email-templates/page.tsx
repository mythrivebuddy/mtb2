"use client";

import { useRouter } from "next/navigation";
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

// API function to fetch templates
const fetchTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await fetch("/api/admin/email-templates");
  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }
  return response.json();
};

export default function EmailTemplatesPage() {
  const router = useRouter();

  // Fetch templates using React Query
  const { data: templates = [], isLoading } = useQuery<EmailTemplate[], Error>({
    queryKey: ["emailTemplates"],
    queryFn: fetchTemplates,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container bg-white rounded-lg mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button onClick={() => router.push("/admin/email-templates/new")}>
          Create New Template
        </Button>
      </div>

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
