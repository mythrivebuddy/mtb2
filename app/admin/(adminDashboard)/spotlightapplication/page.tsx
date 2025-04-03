export default function SpotlightApplication() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">
        Spotlight Application Management
      </h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Current Spotlight</h3>
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="mr-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-pink-100">
                <div className="w-full h-full flex items-center justify-center">
                  AM
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold">Arlene M</h4>
              <p className="text-gray-600">Marketing Coordinator</p>
              <p className="mt-2 text-gray-700">
                This creates a sense of recognition and highlights the
                individual in focus, while maintaining the overall theme of
                growth and inspiration.
              </p>
              <div className="mt-4">
                <button className="px-4 py-2 bg-dark-navy text-white rounded-lg">
                  Edit Spotlight
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Spotlight Applications</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    JD
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium">John Doe</div>
                    <div className="text-sm text-gray-500">
                      john@example.com
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">Designer</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                2025-03-30
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button className="text-green-600 hover:text-green-900 mr-2">
                  Approve
                </button>
                <button className="text-red-600 hover:text-red-900">
                  Decline
                </button>
              </td>
            </tr>
            {/* Add more application rows as needed */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
