

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SpotlightPage() {
  const [isChecked, setIsChecked] = useState(false);

  const handleApply = () => {
    if (!isChecked) {
      toast.error('Please accept the terms and conditions');
      return;
    }
    alert('Spotlight application submitted!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Spotlight Feature</h1>
      
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">What is Spotlight?</h2>

        <p className="text-gray-600 mb-6">
          Spotlight is a premium feature that puts your business profile in front of thousands of potential customers. 
          When you're in the spotlight, your profile appears at the top of search results and gets featured in our 
          weekly newsletter to our entire user base.
        </p>
        
        <h3 className="text-xl font-semibold mb-4">Benefits:</h3>
        <ul className="list-disc pl-6 text-gray-600 mb-8">
          <li className="mb-2">Increased visibility and exposure</li>
          <li className="mb-2">Higher engagement rates</li>
          <li className="mb-2">Priority placement in search results</li>
          <li className="mb-2">Featured in our weekly newsletter</li>
          <li>Access to premium analytics</li>
        </ul>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Terms and Conditions</h3>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 mb-3">
              1. Spotlight duration is 7 days from the date of approval.
            </p>
            <p className="text-gray-600 mb-3">
              2. Content must comply with our community guidelines and terms of service.
            </p>
            <p className="text-gray-600 mb-3">
              3. We reserve the right to remove your spotlight if it violates our policies.
            </p>
            <p className="text-gray-600 mb-3">
              4. Spotlight placement is subject to availability and approval.
            </p>
            <p className="text-gray-600">
              5. No refunds will be issued once the spotlight is active.
            </p>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Checkbox
              id="terms"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the terms and conditions
            </label>
          </div>

          <Button 
            onClick={handleApply}
            className="w-full"
            disabled={!isChecked}
          >
            Apply for Spotlight
          </Button>
        </div>
      </Card>
    </div>
  );
}
