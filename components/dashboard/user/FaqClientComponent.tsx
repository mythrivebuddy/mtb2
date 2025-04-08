'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const fetchFaqs = async (): Promise<Faq[]> => {
  const res = await axios.get('/api/admin/faq');
  return res.data;
};

const FaqClientComponent = () => {
  const { data: faqs, isLoading, isError } = useQuery({
    queryKey: ['faqs'],
    queryFn: fetchFaqs,
  });

  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setActiveFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-900">
        Frequently Asked Questions
      </h1>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load FAQs. Please try again later.</AlertDescription>
        </Alert>
      )}

      {faqs && faqs.length === 0 && (
        <p className="text-center text-muted-foreground">No FAQs available.</p>
      )}

      {faqs && faqs.length > 0 && (
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = activeFaq === faq.id;
            return (
              <Card
                key={faq.id}
                className="transition-all duration-300 ease-in-out border border-muted bg-white shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex justify-between items-center p-4 text-left"
                >
                  <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="text-gray-500" />
                  ) : (
                    <ChevronDown className="text-gray-500" />
                  )}
                </button>
                <div
                  className={`px-4 overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[300px] opacity-100 pb-4' : 'max-h-0 opacity-0'
                  }`}
                >
                  <CardContent className="p-0 text-gray-700 text-sm">
                    {faq.answer}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FaqClientComponent;



// 'use client';

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { ChevronDown, ChevronUp } from 'lucide-react';

// interface Faq {
//   id: string;
//   question: string;
//   answer: string;
// }

// const FaqClientComponent = () => {
//   const [faqs, setFaqs] = useState<Faq[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeFaq, setActiveFaq] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchFaqs = async () => {
//       try {
//         const res = await axios.get('/api/admin/faq');
//         setFaqs(res.data);
//       } catch (error) {
//         console.error('Failed to fetch FAQs:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFaqs();
//   }, []);

//   const toggleFaq = (id: string) => {
//     setActiveFaq((prev) => (prev === id ? null : id));
//   };

//   return (
//     <div className="max-w-3xl mx-auto px-4 py-10">
//       <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Frequently Asked Questions</h1>

//       {loading ? (
//         <p className="text-center text-gray-500">Loading FAQs...</p>
//       ) : faqs.length === 0 ? (
//         <p className="text-center text-gray-500">No FAQs available.</p>
//       ) : (
//         <div className="space-y-4">
//           {faqs.map((faq) => {
//             const isOpen = activeFaq === faq.id;
//             return (
//               <div
//                 key={faq.id}
//                 className="border border-gray-300 rounded-lg shadow-sm bg-white transition hover:shadow-md"
//               >
//                 <button
//                   onClick={() => toggleFaq(faq.id)}
//                   className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
//                 >
//                   <span className="text-lg font-medium text-gray-800">{faq.question}</span>
//                   <span className="text-gray-500">
//                     {isOpen ? <ChevronUp /> : <ChevronDown />}
//                   </span>
//                 </button>
//                 <div
//                   className={`px-4 pb-4 text-gray-700 transition-all duration-300 ease-in-out ${
//                     isOpen ? 'max-h-screen opacity-100' : 'max-h-0 overflow-hidden opacity-0'
//                   }`}
//                 >
//                   {faq.answer}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FaqClientComponent;
