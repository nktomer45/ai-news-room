const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
const isProd = appEnv === 'production';

const apiUrl = import.meta.env.VITE_API_URL || (isProd ? 'https://ai-news-room-1.onrender.com/api' : '/api');

const config = {
  apiUrl: apiUrl,
  env: appEnv,
  isProd: isProd,
  isDev: !isProd,
};

// Log settings for easier debugging (only in development)

console.log('--- VITE CONFIG ---');
console.log('App Env (from .env):', appEnv);
console.log('Connecting to API:', config.apiUrl);
console.log('-------------------');

export default config;




