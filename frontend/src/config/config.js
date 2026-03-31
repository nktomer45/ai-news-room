const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

console.log('Current API URL:', config.apiUrl);

export default config;
