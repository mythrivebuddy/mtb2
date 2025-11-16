"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FaqSchemaForm({ items, setItems }: any) {
  const addItem = () => {
    setItems([...items, { question: "", answer: "" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 mt-4">
      {items.map((item: any, idx: number) => (
        <div
          key={idx}
          className="border p-3 rounded-md space-y-3 bg-muted/40"
        >
          <div>
            <label className="font-medium">Question</label>
            <Input
              value={item.question}
              onChange={(e) => updateItem(idx, "question", e.target.value)}
            />
          </div>

          <div>
            <label className="font-medium">Answer</label>
            <Input
              value={item.answer}
              onChange={(e) => updateItem(idx, "answer", e.target.value)}
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeItem(idx)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button type="button" onClick={addItem}>
        Add FAQ
      </Button>
    </div>
  );
}
