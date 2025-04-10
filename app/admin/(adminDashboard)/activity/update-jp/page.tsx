'use client';

import { useState, useEffect } from 'react';
import { Activity } from '@prisma/client';

export default function UpdateActivityJpPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [jpAmount, setJpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activity/list');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError('Failed to load activities');
      console.log(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/activity/update-jp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: selectedActivityId,
          jpAmount: parseInt(jpAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update JP amount');
      }

      setSuccess('JP amount updated successfully!');
      setJpAmount('');
      setSelectedActivityId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update JP amount');
    } finally {
      setLoading(false);
    }
  };

  console.log(activities);
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Update Activity JP Amount</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
            Select Activity
          </label>
          <select
            id="activity"
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select an activity</option>

            {Array.isArray(activities) && activities?.length > 0 ? (
  activities?.filter(
      (activity) =>
        typeof activity.id === 'string' &&
        activity.id.trim() !== ''
    )?.map((activity) => (
      <option key={activity.id} value={activity.id}>
        {activity.activity ?? 'Unnamed Activity'} (Current JP: {activity.jpAmount ?? 0})
      </option>
    ))
) : (
  <option disabled>No activities found</option>
)}


          </select>
        </div>

        <div>
          <label htmlFor="jpAmount" className="block text-sm font-medium text-gray-700">
            New JP Amount
          </label>
          <input
            type="number"
            id="jpAmount"
            value={jpAmount}
            onChange={(e) => setJpAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="0"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update JP Amount'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
} 