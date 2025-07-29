'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryType, QuestionType } from '../page';

type Props = {
  categories: CategoryType[];
  questions: QuestionType[];
  setQuestions: React.Dispatch<React.SetStateAction<QuestionType[]>>;
};

export default function QuestionManager({ categories, questions, setQuestions }: Props) {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['']);
  const [isMulti, setIsMulti] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const handleAddOption = () => setOptions([...options, '']);
  const handleOptionChange = (i: number, val: string) => {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  };

  const handleAddQuestion = () => {
    if (!text || !categoryId || options.some((o) => o.trim() === '')) return;
    const newQuestion: QuestionType = {
      id: crypto.randomUUID(),
      text,
      options,
      isMulti,
      categoryId,
    };
    setQuestions([...questions, newQuestion]);

    // Reset
    setText('');
    setOptions(['']);
    setIsMulti(false);
    setCategoryId(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={categoryId} onValueChange={(val) => setCategoryId(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} />

        <div className="flex items-center space-x-2">
          <Checkbox checked={isMulti} onCheckedChange={() => setIsMulti(!isMulti)} />
          <Label>Enable Multi Select</Label>
        </div>

        {options.map((opt, i) => (
          <Input
            key={i}
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(i, e.target.value)}
            className="mb-2"
          />
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddOption}>
            + Add Option
          </Button>
          <Button onClick={handleAddQuestion}>Save Question</Button>
        </div>

        <div className="pt-6">
          {questions.map((q) => (
            <div key={q.id} className="border rounded p-2 mb-2">
              <p className="font-semibold">{q.text}</p>
              <p className="text-sm text-muted-foreground">
                {q.options.join(', ')} | {q.isMulti ? 'Multi-select' : 'Single-select'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
