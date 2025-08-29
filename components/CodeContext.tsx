import React, { useState } from 'react';
import { CodeContextFile } from '../types';

interface CodeContextProps {
  files: CodeContextFile[];
  onAddFile: (file: CodeContextFile) => void;
  onRemoveFile: (id: string) => void;
}

export const CodeContext: React.FC<CodeContextProps> = ({ files, onAddFile, onRemoveFile }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url.startsWith('https://github.com/')) {
      setError('Please enter a valid GitHub file URL.');
      return;
    }

    const fileId = crypto.randomUUID();
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    
    // Optimistic UI: Add file immediately with placeholder content
    const newFile: CodeContextFile = { id: fileId, url, fileName, content: 'Loading...' };
    onAddFile(newFile);
    setUrl('');
    setIsLoading(true);

    try {
      const rawUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
      
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file. Status: ${response.status}`);
      }
      const content = await response.text();
      
      // Update the file with real content
      onAddFile({ ...newFile, content });

    } catch (err) {
      // Rollback on error
      onRemoveFile(fileId);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
      <h3 className="text-sm font-semibold mb-2">Code Context (RAG)</h3>
      <form onSubmit={handleAddFile} className="flex items-center space-x-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste public GitHub file URL..."
          className="w-full px-3 py-1.5 text-xs text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
          disabled={isLoading || !url}
        >
          {isLoading ? '...' : 'Add'}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <div className="mt-2 space-y-1">
        {files.map(file => (
          <div key={file.id} className="flex items-center justify-between bg-gray-700 p-1.5 rounded-md text-xs">
            <span className="truncate" title={file.url}>{file.fileName}</span>
            <button onClick={() => onRemoveFile(file.id)} className="text-gray-400 hover:text-red-400">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};