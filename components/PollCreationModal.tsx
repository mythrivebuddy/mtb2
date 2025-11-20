import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PollModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (question: string, options: string[], allowMultiple: boolean) => void;
}

export function PollCreationModal({ isOpen, onOpenChange, onCreatePoll }: PollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(o => o.trim() !== "");
    if (!question.trim() || validOptions.length < 2) return;
    toast.info("Creating poll...");
    onCreatePoll(question, validOptions, allowMultiple);
    setQuestion("");
    setOptions(["", ""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input 
            placeholder="Ask a question..." 
            value={question} 
            onChange={e => setQuestion(e.target.value)} 
          />
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <Input 
                  placeholder={`Option ${idx + 1}`} 
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addOption} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" /> Add Option
          </Button>
          
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="multiple" className="cursor-pointer">Allow multiple answers</Label>
            <Switch id="multiple" checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmit} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>
            Create Poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}