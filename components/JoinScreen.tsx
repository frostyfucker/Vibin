
import React, { useState } from 'react';

interface JoinScreenProps {
  onJoin: (roomName: string, identity: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [identity, setIdentity] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identity && roomName && !isJoining) {
      setIsJoining(true);
      onJoin(roomName, identity);
      // The component will unmount on successful join, so no need to reset isJoining
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Vibe Code</h1>
          <p className="text-gray-400">Collaborative Coding with an AI Partner</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room" className="text-sm font-medium text-gray-300">Vibe Room Name</label>
            <input
              id="room"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., project-phoenix"
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isJoining}
            />
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-300">Your Name</label>
            <input
              id="name"
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g., Ada Lovelace"
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isJoining}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
            disabled={isJoining || !identity || !roomName}
          >
            {isJoining ? 'Joining...' : 'Vibe'}
          </button>
        </form>
         <p className="text-xs text-center text-gray-500 mt-4">
            By clicking "Vibe", you will join a real-time collaborative session.
        </p>
      </div>
    </div>
  );
};

export default JoinScreen;
