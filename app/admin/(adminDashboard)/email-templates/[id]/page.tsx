"use client";

import { useRouter, useParams } from "next/navigation";
import EmailTemplateEditor from "@/components/EmailTemplateEditor";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Define the EmailTemplate interface to match EmailTemplateEditor's expectations
interface EmailTemplate {
  id?: string;
  templateId: string;
  subject: string;
  htmlContent: string;
  description?: string;
}

// Define the form data type for submission
interface TemplateFormData {
  templateId: string;
  subject: string;
  htmlContent: string;
  description?: string;
}

// API function to fetch a template
const fetchTemplate = async (id: string): Promise<EmailTemplate> => {
  const response = await fetch(`/api/admin/email-templates/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }
  return response.json();
};

// API function to save a template
const saveTemplate = async ({
  id,
  data,
  isNew,
}: {
  id: string;
  data: TemplateFormData;
  isNew: boolean;
}): Promise<void> => {
  const url = isNew
    ? "/api/admin/email-templates"
    : `/api/admin/email-templates/${id}`;
  const method = isNew ? "POST" : "PUT";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to save template");
  }
};

export default function EditEmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const isNew = id === "new";

  // Fetch template data using React Query
  const { data: template, isLoading } = useQuery<EmailTemplate, Error>({
    queryKey: ["emailTemplate", id],
    queryFn: () => fetchTemplate(id),
    enabled: !isNew,
  });

  // Mutation for saving the template
  const mutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: () => {
      toast.success("Template saved successfully");
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      router.push("/admin/email-templates");
    },
    onError: (error: Error) => {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    },
  });

  // Handle form submission
  const handleSubmit = async (data: TemplateFormData): Promise<void> => {
    return new Promise((resolve) => {
      mutation.mutate({ id, data, isNew }, { onSuccess: () => resolve() });
    });
  };

  if (isLoading && !isNew) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container bg-white rounded-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? "Create New Template" : "Edit Template"}
      </h1>
      <EmailTemplateEditor initialData={template} onSubmit={handleSubmit} />
    </div>
  );
}
