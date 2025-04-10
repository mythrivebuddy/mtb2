

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/faq');
      setFaqs(res.data);
      console.log(res.data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      await axios.post('/api/admin/faq', { question, answer });
      setQuestion('');
      setAnswer('');
      fetchFaqs();
    } catch (err) {
      console.error('Failed to add FAQ:', err);
      setError('Failed to add FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete("/api/admin/faq", { data: { id } });
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      setError('Failed to delete FAQ');
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  console.log(faqs);

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

      {error && (
        <div className="text-red-600 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading FAQs...</p>
      ) : (
        <ul className="space-y-4">
          {Array.isArray(faqs) && faqs?.length > 0 ? (
            faqs?.map((faq) => {
              if (!faq.id || faq.id.trim() === '') return null;
              return (
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
              );
            })
          ) : (
            <p className="text-gray-500">No FAQs available.</p>
          )}
        </ul>
      )}
    </div>
  );
}
