const isProd = import.meta.env.PROD;

const config = {
  apiUrl: import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:5001/api'),
  isDev: import.meta.env.DEV,
  isProd: isProd,
};

console.log('Current API URL:', config.apiUrl);

export default config;
