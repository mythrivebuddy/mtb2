"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EmailTemplateEditorProps {
  initialData?: {
    id?: string;
    templateId: string;
    subject: string;
    htmlContent: string;
    description?: string;
  };
  onSubmit: (data: {
    templateId: string;
    subject: string;
    htmlContent: string;
    description?: string;
  }) => Promise<void>;
}

const defaultPreviewData = {
  username: "John Doe",
  verificationUrl: "https://preview-link.com/verify",
  resetPasswordUrl: "https://preview-link.com/reset-password",
  email: "john.doe@example.com",
};

export default function EmailTemplateEditor({
  initialData,
  onSubmit,
}: EmailTemplateEditorProps) {
  const [templateId, setTemplateId] = useState(initialData?.templateId || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [htmlContent, setHtmlContent] = useState(
    initialData?.htmlContent || ""
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [previewHtml, setPreviewHtml] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    updatePreview();
  }, [htmlContent]);

  const updatePreview = () => {
    let preview = htmlContent;
    Object.entries(defaultPreviewData).forEach(([key, value]) => {
      preview = preview.replace(
        new RegExp(`{{${key}}}`, "g"),
        value.toString()
      );
    });
    setPreviewHtml(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        templateId,
        subject,
        htmlContent,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-5 px-4">
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">
            📄 Basic Details
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="templateId">Template ID</Label>
              <Input
                id="templateId"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="e.g., welcome-email"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this template for?"
              />
            </div>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">
            ✏️ Email Editor
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="flex flex-col space-y-2">
              <Label>HTML Content</Label>
              <div className="rounded-lg overflow-hidden border bg-[#1e1e1e]">
                <Editor
                  height="300px"
                  defaultLanguage="html"
                  value={htmlContent}
                  onChange={(value) => setHtmlContent(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    theme: "vs-dark",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col space-y-2">
              <Label>Live Preview</Label>
              <div className="border rounded-lg h-[300px] p-4 overflow-auto bg-white shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="prose max-w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 transition-colors"
          >
            {isSubmitting ? "Saving..." : "💾 Save Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
