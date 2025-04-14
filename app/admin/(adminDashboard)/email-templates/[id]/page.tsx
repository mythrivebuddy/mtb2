"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import EmailTemplateEditor from "@/components/EmailTemplateEditor";
import { toast } from "sonner";

export default function EditEmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id !== "new") {
      fetchTemplate();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${id}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url =
        id === "new"
          ? "/api/admin/email-templates"
          : `/api/admin/email-templates/${id}`;

      const method = id === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save template");

      toast.success("Template saved successfully");
      router.push("/admin/email-templates");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container bg-white rounded-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {id === "new" ? "Create New Template" : "Edit Template"}
      </h1>
      <EmailTemplateEditor initialData={template} onSubmit={handleSubmit} />
    </div>
  );
}
