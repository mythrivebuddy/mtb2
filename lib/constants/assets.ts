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
    v1: '/favicon.svg', //  new favicon lives in /public/favicon2.svg
  },
  png:{
    v1:'/favicon.png',    // for push messaging we are using favicon.png everywhere but in service worker we hardcoded this 
  }
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
    png:{
      ...favicon.png,
      current:favicon.svg.v1 // for push messaging we are using favicon.png everywhere but in service worker we hardcoded this 
    }
  },
} as const;

export default assets;