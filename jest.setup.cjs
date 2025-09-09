// jest.setup.cjs
const React = require('react');
require('@testing-library/jest-dom');

/**
 * @typedef {Object} NextImageProps
 * @property {string} src
 * @property {string} alt
 * @property {string} [className]
 * @property {boolean} [fill]
 * @property {boolean} [priority]
 */

/** @type {React.FC<NextImageProps>} */
const MockNextImage = ({ src, alt, className, fill, priority, ...restProps }) => {
  return React.createElement('img', { src, alt, className, ...restProps });
};

jest.mock('next/image', () => ({
  __esModule: true,
  default: MockNextImage,
}));

jest.mock('lucide-react', () => {
  const mockIcon = ({ fill, stroke, ...props }) =>
    React.createElement('svg', { fill: fill || 'none', stroke: stroke || 'currentColor', ...props });
  return new Proxy(
    {},
    {
      get: (_, prop) => mockIcon,
    }
  );
});
