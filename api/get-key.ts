// By placing this file in the /api directory, Vercel will automatically
// create a serverless function for it, accessible at /api/get-key.

// Using the Edge runtime for faster responses.
export const config = {
  runtime: 'edge',
};

// This handler uses the Web Standard Request and Response objects,
// which are available globally in the Vercel Edge Runtime.
export default function handler(request: Request) {
  // process.env is available securely on the server (in the Vercel environment)
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    // If the key is missing in Vercel's settings, return an error.
    return new Response(
      JSON.stringify({ error: 'API_KEY is not configured on the server. Please set it in your Vercel project settings.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // If the key exists, return it in a JSON response.
  return new Response(
    JSON.stringify({ apiKey }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
