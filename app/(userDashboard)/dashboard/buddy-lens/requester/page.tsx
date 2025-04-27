'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import {
  Plus,
  LinkIcon,
  Clock,
  FileQuestion,
  Globe,
  Code2,
  Palette,
  Database,
  BarChart,

} from 'lucide-react';


export default function BuddyLensRequestPage() {
  const router = useRouter();

  
  const [socialMediaUrl, setSocialMediaUrl] = useState('');
  const [tier, setTier] = useState('5min');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [expiresAt, setExpiresAt] = useState('');
  const [jpCost, setJpCost] = useState(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domain, setDomain] = useState('');
  const { data: session } = useSession();
  

  const requesterId = session?.user?.id;
  
  if (!requesterId) {
    toast.error('User not logged in');
    return;
  }


  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!socialMediaUrl || !tier ||  !domain || !expiresAt || questions.some(q => !q.trim())) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`/api/buddy-lens/requester`, {
        requesterId, // Replace with actual user ID
        socialMediaUrl,
        tier,
        // platform,
        // feedbackType,
        domain,
        // tags,
        questions,
        expiresAt,
        jpCost,
      });

      toast.success('Request submitted!');
      router.push("/dashboard/buddy-lens");
      setSocialMediaUrl('');
      setTier('5min');
      // setPlatform('');
      // setFeedbackType('');
      setDomain('');
      // setTags([]);
      setQuestions(['']);
      setExpiresAt('');
      setJpCost(500);
    } catch (err) {
      console.log("Error occured:",err);
      toast.error('Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg p-6 space-y-6">
        <h2 className="text-3xl font-semibold text-center">🎯 Request for Review</h2>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="w-4 h-4" />
            Social Media / Website URL
          </label>
          <Input
            type="url"
            placeholder="https://your-link.com"
            value={socialMediaUrl}
            onChange={(e) => setSocialMediaUrl(e.target.value)}
          />
        </div>
{/* 
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Globe className="w-4 h-4" />
            Select Platform
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
              { label: 'GitHub', icon: <Github className="w-5 h-5" /> },
              { label: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
              { label: 'Twitter', icon: <Twitter className="w-5 h-5" /> },
              { label: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
              { label: 'YouTube', icon: <Youtube className="w-5 h-5" /> },
            ].map(({ label, icon }) => (
              <label
                key={label}
                className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
                ${platform === label ? 'bg-black border-gray-300 border-2 text-white' : 'hover:bg-gray-300'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={platform === label}
                  onChange={() => setPlatform(label)}
                />
                {icon}
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div> */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Code2 className="w-4 h-4" />
            Select Domain
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Profile Optimization', icon: <Palette className="w-5 h-5" /> },
              { label: 'Content Strategy', icon: <Database className="w-5 h-5" /> },
              { label: 'Audience Engagement', icon: <Globe className="w-5 h-5" /> },
              { label: 'Post Performance', icon: <BarChart className="w-5 h-5" /> },
              { label: 'Social Media Analytics', icon: <BarChart className="w-5 h-5" /> },
              { label: 'Friend/Connection Analysis', icon: <Globe className="w-5 h-5" /> },
              { label: 'Follower Growth', icon: <Globe className="w-5 h-5" /> },
            ].map(({ label, icon }) => (
              <label
                key={label}
                className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
                ${domain === label ? 'bg-green-100 border-green-500' : 'hover:bg-gray-100'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={domain === label}
                  onChange={() => setDomain(label)}
                />
                {icon}
                <span className="text-sm text-center">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Select Tier</span>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tier"
                value="5min"
                checked={tier === "5min"}
                onChange={(e) => setTier(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              5 Minutes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tier"
                value="10min"
                checked={tier === "10min"}
                onChange={(e) => setTier(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              10 Minutes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tier"
                value="15min"
                checked={tier === "15min"}
                onChange={(e) => setTier(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              15 Minutes
            </label>
          </div>
        </div>

        {/* <div className="space-y-2">
          <label className="text-sm font-medium">Feedback Type</label>
          <Input
            type="text"
            placeholder="e.g., Profile Optimization"
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
          />
        </div> */}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <FileQuestion className="w-4 h-4" />
            Questions
          </label>
          {questions.map((q, index) => (
            <textarea
              key={index}
              placeholder={`Question ${index + 1}`}
              value={q}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              className="mt-2 w-full border rounded-lg p-2"
            />
          ))}
          {questions.length < 3 && (
            <Button
              type="button"
              onClick={handleAddQuestion}
              variant="ghost"
              className="flex items-center gap-1 text-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Another Question
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Expiry Time
          </label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">JoyPearls Cost</label>
          <Input
            type="number"
            value={jpCost}
            onChange={(e) => setJpCost(Number(e.target.value))}
            min={100}
            step={100}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Card>
    </div>
  );
}
