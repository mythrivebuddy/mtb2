// lib/constants/assets.ts

// versions are just for mappings, we will always use current
const logo = {
  v1: '/logo.png',
  v2: '/logo2.png',
} as const;

const favicon = {
  ico: {
    v1: '/favicon.ico', //this is old favicon lives in /app/favicon.ico, served at root 
  },
  svg: {
    v1: '/favicon2.svg', //  new favicon lives in /public/favicon2.svg
  },
} as const;

const assets = {
  logo: {
    ...logo,
    current: logo.v2, // always points to the latest
  },
  favicon: {
    ico: {
      ...favicon.ico,
      current: favicon.ico.v1, // always points to the latest
    },
    svg: {
      ...favicon.svg,
      current: favicon.svg.v1, // always points to the latest
    },
  },
} as const;

export default assets;