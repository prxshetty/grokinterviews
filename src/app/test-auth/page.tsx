'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestAuth() {
  const [token, setToken] = useState('');
  const [type, setType] = useState('email');
  const [result, setResult] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a direct link to the auth confirm route
      const url = `/auth/confirm?token_hash=${token}&type=${type}`;
      setResult(`Created link: ${url}`);
      
      // Navigate to the link
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Auth Confirm Route</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Token Hash:</label>
          <input 
            type="text" 
            value={token} 
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-1">Type:</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="email">email</option>
            <option value="recovery">recovery</option>
            <option value="invite">invite</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Auth Confirm
        </button>
      </form>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
