const SpotlightCard = () => {
  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
            <img
              src="/project-image.jpg"
              alt="Project"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </div>

          {/* Card Content */}
          <div className="p-4 md:p-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                React
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                TypeScript
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-semibold line-clamp-2">
              Project Title
            </h3>

            <p className="text-sm text-gray-600 line-clamp-3">
              Project description goes here. This is a brief overview of what the project is about and what technologies were used.
            </p>

            {/* Author Info */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src="/avatar.jpg"
                alt="Author"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium">Author Name</p>
                <p className="text-xs text-gray-500">Posted on Jan 1, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightCard; 