"use client";

import React, { useState, useEffect } from "react";
import { useAlignedActionForm } from "@/lib/hooks/useAlignedActionForm";
import moment from "moment";

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

export default function Step3({ onNext, onBack }: Step3Props) {
  const { formData, updateStep3 } = useAlignedActionForm();
  
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Initialize form with properly formatted times
  useEffect(() => {
    const now = moment();
    const defaultFrom = formData.step3?.selectedTime 
      ? moment(formData.step3.selectedTime) 
      : now;
    
    const defaultTo = formData.step3?.secondaryTime 
      ? moment(formData.step3.secondaryTime) 
      : now.clone().add(1, 'hour');
    
    setFromTime(defaultFrom.format('HH:mm'));
    setToTime(defaultTo.format('HH:mm'));
  }, [formData.step3]);

  // Validate time difference is not more than 3 hours
  const validateTimeDifference = (from: string, to: string): boolean => {
    const fromMoment = moment(from, 'HH:mm');
    const toMoment = moment(to, 'HH:mm');
    
    // If to is earlier than from, assume it's for the next day
    if (toMoment.isBefore(fromMoment)) {
      toMoment.add(1, 'day');
    }
    
    const diffHours = toMoment.diff(fromMoment, 'hours', true);
    return diffHours <= 3;
  };

  // Handle time changes
  const handleFromTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFromTime = e.target.value;
    setFromTime(newFromTime);
    
    if (!validateTimeDifference(newFromTime, toTime)) {
      setErrorMessage("Max 3 hours !!");
    } else {
      setErrorMessage("");
    }
  };

  const handleToTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToTime = e.target.value;
    setToTime(newToTime);
    
    if (!validateTimeDifference(fromTime, newToTime)) {
      setErrorMessage("Max 3 hours !!");
    } else {
      setErrorMessage("");
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (errorMessage) {
      return;
    }
    
    // Create dates from the time strings
    const currentDate = moment().format('YYYY-MM-DD');
    const fromDateTime = moment(`${currentDate} ${fromTime}`, 'YYYY-MM-DD HH:mm').toDate();
    const toDateTime = moment(`${currentDate} ${toTime}`, 'YYYY-MM-DD HH:mm').toDate();
    
    // If to time is earlier than from time, assume it's for the next day
    if (toDateTime < fromDateTime) {
      const nextDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const adjustedToDateTime = moment(`${nextDate} ${toTime}`, 'YYYY-MM-DD HH:mm').toDate();
      
      updateStep3({
        selectedTime: fromDateTime,
        secondaryTime: adjustedToDateTime
      });
    } else {
      updateStep3({
        selectedTime: fromDateTime,
        secondaryTime: toDateTime
      });
    }
    
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-xl font-semibold mb-6 text-center">Choose your flow window</div>
      
      {/* Time range selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            From-
          </label>
          <input
            type="time"
            value={fromTime}
            onChange={handleFromTimeChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            To-
          </label>
          <input
            type="time"
            value={toTime}
            onChange={handleToTimeChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {errorMessage && (
          <div className="flex items-center justify-center">
            <div className="text-red-500 border border-red-500 px-2 py-1 text-sm inline-block">
              {errorMessage}
            </div>
            <span className="ml-2">Max 3 hours !!</span>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!!errorMessage}
          className={`px-6 py-2 rounded-md ${
            !errorMessage
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } transition-colors`}
        >
          Next
        </button>
      </div>
    </form>
  );
}