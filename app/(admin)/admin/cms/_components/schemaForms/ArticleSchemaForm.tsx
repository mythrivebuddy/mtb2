"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import { ArticleFormData } from "@/types/types";

export function ArticleSchemaForm({
  data,
  setData,
}: {
  data: ArticleFormData;
  setData: React.Dispatch<React.SetStateAction<ArticleFormData>>;
}) {
  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Article Schema</h3>

      {/* Headline */}
      <div>
        <Label>Headline</Label>
        <Input
          value={data.headline}
          onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))}
        />
      </div>

      {/* Author */}
      <div>
        <Label>Author</Label>
        <Input
          value={data.author}
          onChange={(e) => setData((d) => ({ ...d, author: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div>
        <Label>Description (Optional)</Label>
        <Textarea
          rows={3}
          value={data.description || ""}
          onChange={(e) =>
            setData((d) => ({ ...d, description: e.target.value }))
          }
        />
      </div>

      {/* Publish Date */}
      <div>
        <Label>Publish Date</Label>
        <Input
          type="date"
          value={data.datePublished}
          onChange={(e) =>
            setData((d) => ({ ...d, datePublished: e.target.value }))
          }
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Article Image</Label>

        {/* Preview */}
        {data.image && (
          <img
            src={data.image}
            className="w-40 h-40 rounded object-contain "
            alt="article-image-preview"
          />
        )}

        <div className="flex gap-3 items-center">
          <Input
            value={data.image}
            onChange={(e) => setData((d) => ({ ...d, image: e.target.value }))}
            placeholder="Paste image URL or upload"
            className="flex-1"
          />

          <Button
            type="button"
            onClick={() =>
              document.getElementById("articleImageUpload")?.click()
            }
          >
            Upload
          </Button>

          <input
            id="articleImageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                toast.info("Uploading image...");
                const fd = new FormData();
                fd.append("file", file);

                const res = await axios.post("/api/admin/cms/upload", fd);

                if (res.data?.url) {
                  setData((d) => ({ ...d, image: res.data.url }));
                  toast.success("Image uploaded!");
                } else {
                  toast.error("Upload failed!");
                }
              } catch (err) {
                console.log(err);
                toast.error("Upload error");
              } finally {
                e.target.value = ""; // reset input
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
