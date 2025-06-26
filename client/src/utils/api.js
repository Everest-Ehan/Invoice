// Get the base API URL based on environment
export const getApiUrl = () => {
  // In production (Vercel), use relative URLs which will work with the same domain
  if (import.meta.env.PROD) {
    return '';
  }
  // In development, use localhost
  return 'http://localhost:5000';
};

export const apiUrl = getApiUrl();
