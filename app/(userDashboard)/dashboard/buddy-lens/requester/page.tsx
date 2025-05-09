'use client';

import { JSX, useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
  LinkIcon,
  FileQuestion,
  Code2,
  Users,
  Brush,
  BarChart3,
  TrendingUp,
  MessageSquareText,
  Smile,
} from 'lucide-react';

interface ApiErrorResponse {
  message?: string;
}

const DOMAIN_QUESTIONS: Record<string, string[]> = {
  'Clarity & Messaging': [
    'Is it clear what I do at a glance?',
    'Does my bio explain who I help and how?',
    'Is my call-to-action obvious and compelling?',
    'Do I sound human or too robotic?',
    'Is anything confusing or vague?',
  ],
  'Target Audience Fit': [
    'Can you tell who my ideal audience is?',
    'Would you know if this page is for you?',
    'Do my posts/bio speak to a specific niche or group?',
    'Am I being too general or too specific?',
  ],
  'Visual Aesthetic': [
    'Do my profile pic and cover/banner image look professional and aligned with my brand?',
    'Is the overall vibe (colors, fonts, layout) cohesive?',
    'Does my feed have a consistent look and feel?',
    'Do I look approachable and trustworthy?',
  ],
  'Content Impact': [
    'Are my captions engaging and clear?',
    'Do I share value, or does it feel like noise?',
    'Are my posts scroll-stopping or easy to overlook?',
    'Is it easy to tell what kind of content I usually post?',
  ],
  'Conversion Readiness': [
    'Can this profile turn followers into clients or leads?',
    'Would this page make someone want to learn more?',
    'Is it easy to book a call, buy, or connect further?',
    'Does it build trust quickly?',
    'What’s missing that could increase conversions?',
  ],
  'First Impressions': [
    'What’s the first word that comes to mind when you see my profile?',
    'What kind of person/business do you think I am?',
    'What emotion does my profile evoke?',
    'Would you follow or click away?',
  ],
};

const DOMAIN_ICONS: Record<string, JSX.Element> = {
  'Clarity & Messaging': <MessageSquareText className="w-4 h-4 text-indigo-500" />,
  'Target Audience Fit': <Users className="w-4 h-4 text-indigo-500" />,
  'Visual Aesthetic': <Brush className="w-4 h-4 text-indigo-500" />,
  'Content Impact': <BarChart3 className="w-4 h-4 text-indigo-500" />,
  'Conversion Readiness': <TrendingUp className="w-4 h-4 text-indigo-500" />,
  'First Impressions': <Smile className="w-4 h-4 text-indigo-500" />,
};

export default function BuddyLensRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [socialMediaUrl, setSocialMediaUrl] = useState('');
  const [tier, setTier] = useState('5min');
  const [domain, setDomain] = useState('');
  const [questions, setQuestions] = useState<string[]>(['', '', '']);
  const [customInputs, setCustomInputs] = useState<string[]>(['', '', '']);
  const [jpCost, setJpCost] = useState(500);

  const requesterId = session?.user?.id;

  const { mutate: submitRequest, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!requesterId) throw new Error('User not logged in');
      if (!socialMediaUrl || !tier || !domain || questions.some(q => !q.trim())) {
        throw new Error('Please fill in all fields');
      }
      return axios.post('/api/buddy-lens/requester', {
        requesterId,
        socialMediaUrl,
        tier,
        domain,
        questions: questions.map((q, idx) => q === 'Other' ? customInputs[idx] : q),
        jpCost,
      });
    },
    onSuccess: () => {
      toast.success('Request submitted!');
      router.push('/dashboard/buddy-lens');
      setSocialMediaUrl('');
      setTier('5min');
      setDomain('');
      setQuestions(['', '', '']);
      setCustomInputs(['', '', '']);
      setJpCost(500);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const message = axiosError.response?.data?.message || axiosError.message || 'Something went wrong';
        toast.error(`Error: ${message}`);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Unexpected error occurred');
      }
    },
  });

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleCustomInputChange = (index: number, value: string) => {
    const updated = [...customInputs];
    updated[index] = value;
    setCustomInputs(updated);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <Card className="rounded-xl shadow-md border border-gray-200 bg-white p-8 space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-800">📋 BuddyLens Review Request</h2>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Code2 className="w-4 h-4" />
            Select Domain
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.keys(DOMAIN_QUESTIONS).map((label) => (
              <label
                key={label}
                className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all ${domain === label ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={domain === label}
                  onChange={() => setDomain(label)}
                />
                {DOMAIN_ICONS[label]} <span className="text-sm text-center">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Select Tier</span>
          <div className="flex flex-col gap-2">
            {['5min', '10min', '15min'].map((value) => (
              <label key={value} className="flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="tier"
                  value={value}
                  checked={tier === value}
                  onChange={(e) => setTier(e.target.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                {value === '5min' ? '5 Minutes' : value === '10min' ? '10 Minutes' : '15 Minutes'}
              </label>
            ))}
          </div>
        </div>

        {domain && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileQuestion className="w-4 h-4" />
              Choose Questions
            </label>
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                <select
                  value={questions[index]}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  className="w-full border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a question</option>
                  {DOMAIN_QUESTIONS[domain]?.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                  <option value="Other">Other (Custom Question)</option>
                </select>
                {questions[index] === 'Other' && (
                  <Input
                    type="text"
                    placeholder="Enter your custom question"
                    value={customInputs[index]}
                    onChange={(e) => handleCustomInputChange(index, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">JoyPearls Cost</label>
          <Input
            type="number"
            value={jpCost}
            onChange={(e) => setJpCost(Number(e.target.value))}
            min={100}
            step={100}
          />
        </div>

        <Button
          onClick={() => submitRequest()}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Card>
    </div>
  );
}



// 'use client';

// import { useState } from 'react';
// import { toast } from 'sonner';
// import { useMutation } from '@tanstack/react-query';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import axios, { AxiosError } from 'axios';
// import {
//   Plus,
//   LinkIcon,
//   Clock,
//   FileQuestion,
//   Code2,
//   Palette,
//   Database,
//   Globe,
//   BarChart,
// } from 'lucide-react';

// interface ApiErrorResponse {
//   message?: string;
// }

// export default function BuddyLensRequestPage() {
//   const router = useRouter();
//   const { data: session } = useSession();

//   const [socialMediaUrl, setSocialMediaUrl] = useState('');
//   const [tier, setTier] = useState('5min');
//   const [questions, setQuestions] = useState<string[]>(['']);
//   // const [expiresAt, setExpiresAt] = useState('');
//   const [jpCost, setJpCost] = useState(500);
//   const [domain, setDomain] = useState('');

//   const requesterId = session?.user?.id;


// const { mutate: submitRequest, isPending: isSubmitting } = useMutation({
//   mutationFn: async () => {
//     if (!requesterId) {
//       throw new Error('User not logged in');
//     }

//     if (!socialMediaUrl || !tier || !domain || questions.some(q => !q.trim())) {
//       throw new Error('Please fill in all fields');
//     }

//     return axios.post(`/api/buddy-lens/requester`, {
//       requesterId,
//       socialMediaUrl,
//       tier,
//       domain,
//       questions,
//       // expiresAt,
//       jpCost,
//     });
//   },

//   onSuccess: () => {
//     toast.success('Request submitted!');
//     router.push("/dashboard/buddy-lens");

//     // Clear the form
//     setSocialMediaUrl('');
//     setTier('5min');
//     setDomain('');
//     setQuestions(['']);
//     // setExpiresAt('');
//     setJpCost(500);
//   },

//   onError: (error: unknown) => {
//     if (axios.isAxiosError(error)) {
//       const axiosError = error as AxiosError<ApiErrorResponse>;
//       const message = axiosError.response?.data?.message || axiosError.message || 'Something went wrong';
//       toast.error(`Error: ${message}`);
//       console.error('Axios error response:', axiosError.response);
//     } else if (error instanceof Error) {
//       toast.error(error.message);
//     } else {
//       toast.error('Unexpected error occurred');
//     }
//   }
// });

//   const handleAddQuestion = () => {
//     setQuestions([...questions, '']);
//   };

//   const handleQuestionChange = (index: number, value: string) => {
//     const updated = [...questions];
//     updated[index] = value;
//     setQuestions(updated);
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">🎯 Request for Review</h2>

//         {/* Social Media URL */}
//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <LinkIcon className="w-4 h-4" />
//             Social Media / Website URL
//           </label>
//           <Input
//             type="url"
//             placeholder="https://your-link.com"
//             value={socialMediaUrl}
//             onChange={(e) => setSocialMediaUrl(e.target.value)}
//           />
//         </div>

//         {/* Domain Selection */}
//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <Code2 className="w-4 h-4" />
//             Select Domain
//           </label>
//           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//             {[
//               { label: 'Profile Optimization', icon: <Palette className="w-5 h-5" /> },
//               { label: 'Content Strategy', icon: <Database className="w-5 h-5" /> },
//               { label: 'Audience Engagement', icon: <Globe className="w-5 h-5" /> },
//               { label: 'Post Performance', icon: <BarChart className="w-5 h-5" /> },
//               { label: 'Social Media Analytics', icon: <BarChart className="w-5 h-5" /> },
//               { label: 'Friend/Connection Analysis', icon: <Globe className="w-5 h-5" /> },
//               { label: 'Follower Growth', icon: <Globe className="w-5 h-5" /> },
//             ].map(({ label, icon }) => (
//               <label
//                 key={label}
//                 className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
//                 ${domain === label ? 'bg-green-100 border-green-500' : 'hover:bg-gray-100'}`}
//               >
//                 <input
//                   type="checkbox"
//                   className="hidden"
//                   checked={domain === label}
//                   onChange={() => setDomain(label)}
//                 />
//                 {icon}
//                 <span className="text-sm text-center">{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         {/* Tier Selection */}
//         <div className="space-y-2">
//           <span className="text-sm font-medium">Select Tier</span>
//           <div className="flex flex-col gap-2">
//             {['5min', '10min', '15min'].map((value) => (
//               <label key={value} className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="tier"
//                   value={value}
//                   checked={tier === value}
//                   onChange={(e) => setTier(e.target.value)}
//                   className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
//                 />
//                 {value === '5min' ? '5 Minutes' : value === '10min' ? '10 Minutes' : '15 Minutes'}
//               </label>
//             ))}
//           </div>
//         </div>

//         {/* Questions */}
//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <FileQuestion className="w-4 h-4" />
//             Questions
//           </label>
//           {questions.map((q, index) => (
//             <textarea
//               key={index}
//               placeholder={`Question ${index + 1}`}
//               value={q}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//               className="mt-2 w-full border rounded-lg p-2"
//             />
//           ))}
//           {questions.length < 3 && (
//             <Button
//               type="button"
//               onClick={handleAddQuestion}
//               variant="ghost"
//               className="flex items-center gap-1 text-blue-600"
//             >
//               <Plus className="w-4 h-4" /> Add Another Question
//             </Button>
//           )}
//         </div>

//         {/* Expiry Time */}
//         {/* <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <Clock className="w-4 h-4" />
//             Expiry Time
//           </label>
//           <Input
//             type="datetime-local"
//             value={expiresAt}
//             onChange={(e) => setExpiresAt(e.target.value)}
//           />
//         </div> */}

//         {/* JoyPearls Cost */}
//         <div className="space-y-2">
//           <label className="text-sm font-medium">JoyPearls Cost</label>
//           <Input
//             type="number"
//             value={jpCost}
//             onChange={(e) => setJpCost(Number(e.target.value))}
//             min={100}
//             step={100}
//           />
//         </div>

//         {/* Submit Button */}
//         <Button
//           onClick={() => submitRequest()}
//           disabled={isSubmitting}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//         >
//           {isSubmitting ? 'Submitting...' : 'Submit Request'}
//         </Button>
//       </Card>
//     </div>
//   );
// }



// 'use client';

// import { useState } from 'react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';

// import {
//   Plus,
//   LinkIcon,
//   Clock,
//   FileQuestion,
//   Globe,
//   Code2,
//   Palette,
//   Database,
//   BarChart,

// } from 'lucide-react';


// export default function BuddyLensRequestPage() {
//   const router = useRouter();

  
//   const [socialMediaUrl, setSocialMediaUrl] = useState('');
//   const [tier, setTier] = useState('5min');
//   const [questions, setQuestions] = useState<string[]>(['']);
//   const [expiresAt, setExpiresAt] = useState('');
//   const [jpCost, setJpCost] = useState(500);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [domain, setDomain] = useState('');
//   const { data: session } = useSession();
  

//   const requesterId = session?.user?.id;
  
//   if (!requesterId) {
//     toast.error('User not logged in');
//     return;
//   }


//   const handleAddQuestion = () => {
//     setQuestions([...questions, '']);
//   };

//   const handleQuestionChange = (index: number, value: string) => {
//     const updated = [...questions];
//     updated[index] = value;
//     setQuestions(updated);
//   };

//   const handleSubmit = async () => {
//     if (!socialMediaUrl || !tier ||  !domain || !expiresAt || questions.some(q => !q.trim())) {
//       toast.error('Please fill in all fields');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await axios.post(`/api/buddy-lens/requester`, {
//         requesterId, // Replace with actual user ID
//         socialMediaUrl,
//         tier,
//         // platform,
//         // feedbackType,
//         domain,
//         // tags,
//         questions,
//         expiresAt,
//         jpCost,
//       });

//       toast.success('Request submitted!');
//       router.push("/dashboard/buddy-lens");
//       setSocialMediaUrl('');
//       setTier('5min');
//       // setPlatform('');
//       // setFeedbackType('');
//       setDomain('');
//       // setTags([]);
//       setQuestions(['']);
//       setExpiresAt('');
//       setJpCost(500);
//     } catch (err) {
//       console.log("Error occured:",err);
//       toast.error('Something went wrong!');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <Card className="rounded-2xl shadow-lg p-6 space-y-6">
//         <h2 className="text-3xl font-semibold text-center">🎯 Request for Review</h2>

//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <LinkIcon className="w-4 h-4" />
//             Social Media / Website URL
//           </label>
//           <Input
//             type="url"
//             placeholder="https://your-link.com"
//             value={socialMediaUrl}
//             onChange={(e) => setSocialMediaUrl(e.target.value)}
//           />
//         </div>
// {/* 
//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <Globe className="w-4 h-4" />
//             Select Platform
//           </label>
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//             {[
//               { label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
//               { label: 'GitHub', icon: <Github className="w-5 h-5" /> },
//               { label: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
//               { label: 'Twitter', icon: <Twitter className="w-5 h-5" /> },
//               { label: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
//               { label: 'YouTube', icon: <Youtube className="w-5 h-5" /> },
//             ].map(({ label, icon }) => (
//               <label
//                 key={label}
//                 className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
//                 ${platform === label ? 'bg-black border-gray-300 border-2 text-white' : 'hover:bg-gray-300'}`}
//               >
//                 <input
//                   type="checkbox"
//                   className="hidden"
//                   checked={platform === label}
//                   onChange={() => setPlatform(label)}
//                 />
//                 {icon}
//                 <span className="text-sm">{label}</span>
//               </label>
//             ))}
//           </div>
//         </div> */}

//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <Code2 className="w-4 h-4" />
//             Select Domain
//           </label>
//           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//             {[
//               { label: 'Profile Optimization', icon: <Palette className="w-5 h-5" /> },
//               { label: 'Content Strategy', icon: <Database className="w-5 h-5" /> },
//               { label: 'Audience Engagement', icon: <Globe className="w-5 h-5" /> },
//               { label: 'Post Performance', icon: <BarChart className="w-5 h-5" /> },
//               { label: 'Social Media Analytics', icon: <BarChart className="w-5 h-5" /> },
//               { label: 'Friend/Connection Analysis', icon: <Globe className="w-5 h-5" /> },
//               { label: 'Follower Growth', icon: <Globe className="w-5 h-5" /> },
//             ].map(({ label, icon }) => (
//               <label
//                 key={label}
//                 className={`flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-all
//                 ${domain === label ? 'bg-green-100 border-green-500' : 'hover:bg-gray-100'}`}
//               >
//                 <input
//                   type="checkbox"
//                   className="hidden"
//                   checked={domain === label}
//                   onChange={() => setDomain(label)}
//                 />
//                 {icon}
//                 <span className="text-sm text-center">{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="space-y-2">
//           <span className="text-sm font-medium">Select Tier</span>
//           <div className="flex flex-col gap-2">
//             <label className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="tier"
//                 value="5min"
//                 checked={tier === "5min"}
//                 onChange={(e) => setTier(e.target.value)}
//                 className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
//               />
//               5 Minutes
//             </label>
//             <label className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="tier"
//                 value="10min"
//                 checked={tier === "10min"}
//                 onChange={(e) => setTier(e.target.value)}
//                 className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
//               />
//               10 Minutes
//             </label>
//             <label className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 name="tier"
//                 value="15min"
//                 checked={tier === "15min"}
//                 onChange={(e) => setTier(e.target.value)}
//                 className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
//               />
//               15 Minutes
//             </label>
//           </div>
//         </div>

//         {/* <div className="space-y-2">
//           <label className="text-sm font-medium">Feedback Type</label>
//           <Input
//             type="text"
//             placeholder="e.g., Profile Optimization"
//             value={feedbackType}
//             onChange={(e) => setFeedbackType(e.target.value)}
//           />
//         </div> */}

//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <FileQuestion className="w-4 h-4" />
//             Questions
//           </label>
//           {questions.map((q, index) => (
//             <textarea
//               key={index}
//               placeholder={`Question ${index + 1}`}
//               value={q}
//               onChange={(e) => handleQuestionChange(index, e.target.value)}
//               className="mt-2 w-full border rounded-lg p-2"
//             />
//           ))}
//           {questions.length < 3 && (
//             <Button
//               type="button"
//               onClick={handleAddQuestion}
//               variant="ghost"
//               className="flex items-center gap-1 text-blue-600"
//             >
//               <Plus className="w-4 h-4" /> Add Another Question
//             </Button>
//           )}
//         </div>

//         <div className="space-y-2">
//           <label className="flex items-center gap-2 text-sm font-medium">
//             <Clock className="w-4 h-4" />
//             Expiry Time
//           </label>
//           <Input
//             type="datetime-local"
//             value={expiresAt}
//             onChange={(e) => setExpiresAt(e.target.value)}
//           />
//         </div>

//         <div className="space-y-2">
//           <label className="text-sm font-medium">JoyPearls Cost</label>
//           <Input
//             type="number"
//             value={jpCost}
//             onChange={(e) => setJpCost(Number(e.target.value))}
//             min={100}
//             step={100}
//           />
//         </div>

//         <Button
//           onClick={handleSubmit}
//           disabled={isSubmitting}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//         >
//           {isSubmitting ? 'Submitting...' : 'Submit Request'}
//         </Button>
//       </Card>
//     </div>
//   );
// }
