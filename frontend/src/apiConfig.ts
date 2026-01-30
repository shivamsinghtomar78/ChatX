const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
if (typeof window !== 'undefined') {
    console.log('[API Config] API_BASE_URL:', API_BASE_URL || '(empty - using relative path)');
}
export default API_BASE_URL;
