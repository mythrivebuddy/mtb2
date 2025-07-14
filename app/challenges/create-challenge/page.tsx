"use client"

import { useState, useRef, useEffect } from "react";
import {Calendar1Icon, CalendarIcon, PlusCircle, StarIcon} from "lucide-react";
import { useRouter } from "next/navigation";


export default function CreateChallenge() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    cost: "",
    reward: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "Public",
    penalty: "",
    tasks: [""],
  });

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push("/let-others-roll");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const addTask = () => {
    setFormData({ ...formData, tasks: [...formData.tasks, ""] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center justify-center p-4">
      <div className="w-full container">
        <h1 className="text-4xl font-extrabold text-purple-900 text-center mb-8 drop-shadow-lg">Create Your Challenge</h1>
        <p className="text-center mb-8 text-lg text-purple-700">Welcome! Craft your unique challenge and inspire others!</p>
        <div className="bg-white p-6 rounded-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              className="flex-1 p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Challenge Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <input
              className="p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Cost (JP)"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
            <div className="p-3 border-2 border-purple-200 rounded-xl flex items-center focus-within:ring-2 focus-within:ring-purple-100">
              <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
              <input
                placeholder="Reward (JP)"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              />
            </div>
          </div>
          <textarea
            className="w-full p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="Detailed Description (e.g., goals, rules)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="p-3 border-2 border-purple-200 rounded-xl flex items-center focus-within:ring-2 focus-within:ring-purple-100">
              <Calendar1Icon className="w-6 h-6 text-purple-500 mr-2" />
              <input
                placeholder="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="p-3 border-2 border-purple-200 rounded-xl flex items-center focus-within:ring-2 focus-within:ring-purple-100">
              <Calendar1Icon className="w-6 h-6 text-purple-500 mr-2" />
              <input
                placeholder="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center">
            <div className="flex items-center">
              <input
                type="radio"
                name="type"
                checked={formData.type === "Public"}
                onChange={() => setFormData({ ...formData, type: "Public" })}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-purple-800">Public</span>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                name="type"
                checked={formData.type === "Personal"}
                onChange={() => setFormData({ ...formData, type: "Personal" })}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-purple-800">Personal</span>
            </div>
            <input
              className="p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Penalty (JP/day)"
              value={formData.penalty}
              onChange={(e) => setFormData({ ...formData, penalty: e.target.value })}
            />
          </div>
          {formData.tasks.map((task, index) => (
            <input
              key={index}
              className="w-full p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder={`Task ${index + 1}`}
              value={task}
              onChange={(e) => {
                const newTasks = [...formData.tasks];
                newTasks[index] = e.target.value;
                setFormData({ ...formData, tasks: newTasks });
              }}
            />
          ))}
          <button
            onClick={addTask}
            className="w-full bg-purple-500 text-white p-3 rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center"
          >
            <PlusCircle className="w-6 h-6 mr-2" /> Add Another Task
          </button>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.push("/")}
              className="bg-gray-300 text-gray-800 p-3 rounded-xl hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all"
            >
              Create Challenge
            </button>
          </div>
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div
              ref={modalRef}
              className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out hover:scale-105"
            >
              <h2 className="text-2xl font-bold text-purple-900 mb-4">Insufficient JP Alert</h2>
              <p className="text-gray-700 mb-4">Oops! It seems you don’t have enough JP to create this challenge.</p>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Current JP Balance: 45 JP</li>
                <li>Required JP: 100 JP</li>
                <li>Suggested Action: Earn more JP by completing challenges!</li>
              </ul>
              <p className="text-purple-700 font-semibold">Visit the Rewards section to boost your JP!</p>
              <button
                onClick={handleModalClose}
                className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Close & Explore Rewards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}