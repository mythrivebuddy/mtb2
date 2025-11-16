"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ArticleSchemaForm({ data, setData }: any) {
  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="font-medium">Headline</label>
        <Input
          value={data.headline}
          onChange={(e) => update("headline", e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Author</label>
        <Input
          value={data.author}
          onChange={(e) => update("author", e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Publish Date</label>
        <Input
          type="date"
          value={data.datePublished}
          onChange={(e) => update("datePublished", e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Image URL (optional)</label>
        <Input
          value={data.image}
          onChange={(e) => update("image", e.target.value)}
        />
      </div>
    </div>
  );
}
