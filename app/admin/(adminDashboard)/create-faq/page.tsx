'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const fetchFaqs = async () => {
    const res = await axios.get('/api/admin/faq');
    setFaqs(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) return;

    await axios.post('/api/admin/faq', { question, answer });
    setQuestion('');
    setAnswer('');
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/admin/faq/${id}`);
    fetchFaqs();
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">FAQs</h2>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Enter Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Enter Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Add FAQ
        </button>
      </form>

      <ul className="space-y-4">
        {faqs.map((faq) => (
          <li key={faq.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{faq.question}</p>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
              <button
                onClick={() => handleDelete(faq.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
