"use client";
import type { Question, Category } from "@prisma/client";

// The question object from the server will include the category
type QuestionWithCategory = Question & { category: Category };

export function QuestionList({ questions }: { questions: QuestionWithCategory[] }) {
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this question?")) {
            try {
                await fetch(`/api/questions/${id}`, { method: 'DELETE' });
                alert("Question deleted successfully.");
                window.location.reload();
            } catch (error) {
                alert("Failed to delete question.");
                console.error("Error deleting question:", error);
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Survey Questions</h2>
            <div className="space-y-4">
                {questions.length > 0 ? (
                    questions.map((q) => (
                        <div key={q.id} className="p-4 border rounded-md bg-gray-50">
                            <p className="font-semibold text-gray-800">{q.text}</p>
                            <p className="text-sm text-gray-500 my-1">
                                Category: <span className="font-medium">{q.category.name}</span>
                            </p>
                            <ul className="list-disc pl-5 mt-2 text-gray-700">
                                {q.options.map((opt, index) => (
                                    <li key={index}>
                                        {opt}
                                    </li>
                                ))}
                            </ul>
                            <div className="text-right mt-2">
                              <button 
                                onClick={() => handleDelete(q.id)} 
                                className="text-red-600 hover:text-red-800 text-sm font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No questions found. Add one to get started!</p>
                )}
            </ul>
        </div>
    );
}
