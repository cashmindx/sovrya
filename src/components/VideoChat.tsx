import React from 'react';

interface VideoChatProps {
  avatars: string[];
  voice: string;
  mood: string;
  role: string;
  topic: string;
  boundaries: string;
  useAR: boolean;
}

const VideoChat: React.FC<VideoChatProps> = ({ avatars, voice, mood, role, topic, boundaries, useAR }) => {
  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold">Video Chat</h2>
      <p>Avatars: {avatars.join(', ')}</p>
      <p>Voice: {voice}</p>
      <p>Mood: {mood}</p>
      <p>Role: {role}</p>
      <p>Topic: {topic}</p>
      <p>Boundaries: {boundaries}</p>
      <p>AR HoloChat: {useAR ? 'Enabled' : 'Disabled'}</p>
      <div className="mt-4 bg-gray-200 h-48 flex items-center justify-center">
        <p>Video Chat Placeholder</p>
      </div>
    </div>
  );
};

export default VideoChat;
