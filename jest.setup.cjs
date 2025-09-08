// jest.setup.cjs
const React = require('react');
require('@testing-library/jest-dom');

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, fill, priority, ...restProps }) => {
    return React.createElement('img', { src, alt, className, ...restProps });
  },
}));
jest.mock('lucide-react', () => ({
  // Replace with actual icon names used in Home (e.g., Camera, Star, etc.)
  Camera: ({ fill, stroke, ...props }) => React.createElement('svg', { fill: fill || 'none', stroke: stroke || 'currentColor', ...props }),
  Star: ({ fill, stroke, ...props }) => React.createElement('svg', { fill: fill || 'none', stroke: stroke || 'currentColor', ...props }),
  // Add other icons as needed
}));