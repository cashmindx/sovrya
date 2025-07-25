import React, { useState, useEffect } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import VideoChat from './VideoChat';

const SovryaChat: React.FC = () => {
  const [avatars, setAvatars] = useState<{ id: string; name: string; sphere: string }[]>([]);
  const [selectedAvatars, setSelectedAvatars] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedRole, setSelectedRole] = useState('friend');
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [boundaries, setBoundaries] = useState('positive');
  const [useAR, setUseAR] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      const avatarCollection = collection(db, 'avatars');
      const avatarSnapshot = await getDocs(avatarCollection);
      const avatarList = avatarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvatars(avatarList as { id: string; name: string; sphere: string }[]);
    };
    fetchAvatars();
    auth.onAuthStateChanged(setUser);
  }, []);

  const createSubscription = async (data: any, actions: any) => {
    if (!user) {
      alert('Please log in to continue.');
      return;
    }
    try {
      const response = await fetch('/api/paypal-create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          amount: 10.00,
          item_name: 'Sovrya Premium Subscription',
        }),
      });
      const { subscriptionId } = await response.json();
      return subscriptionId;
    } catch (error) {
      console.error('PayPal subscription error:', error);
      alert('Failed to create subscription.');
    }
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      await actions.subscription.activate(data.subscriptionID);
      window.location.href = '/success';
    } catch (error) {
      console.error('PayPal approval error:', error);
      alert('Subscription activation failed.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Sovrya AI Agent</h1>
      {user ? (
        <div className="space-y-4">
          <div>
            <label className="block text-lg">DreamScape Avatar</label>
            <select
              multiple
              className="border p-2 rounded-lg w-full"
              onChange={e => setSelectedAvatars(Array.from(e.target.selectedOptions, o => o.value))}
            >
              {avatars.map(avatar => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name} ({avatar.sphere})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-lg">Voice</label>
            <select className="border p-2 rounded-lg w-full" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}>
              <option value="default">Default</option>
              <option value="male">Young Male</option>
              <option value="female">Older Female</option>
            </select>
          </div>
          <div>
            <label className="block text-lg">Mood</label>
            <select className="border p-2 rounded-lg w-full" value={selectedMood} onChange={e => setSelectedMood(e.target.value)}>
              <option value="happy">Happy</option>
              <option value="romantic">Romantic</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div>
            <label className="block text-lg">Role</label>
            <select className="border p-2 rounded-lg w-full" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              <option value="friend">Friend</option>
              <option value="boyfriend">Boyfriend</option>
              <option value="girlfriend">Girlfriend</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-lg">Topic</label>
            <select className="border p-2 rounded-lg w-full" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="medical">Medical</option>
              <option value="science">Science</option>
              <option value="philosophy">Philosophy</option>
              <option value="relationships">Relationships</option>
            </select>
          </div>
          <div>
            <label className="block text-lg">Ethical Boundaries</label>
            <select className="border p-2 rounded-lg w-full" value={boundaries} onChange={e => setBoundaries(e.target.value)}>
              <option value="positive">Positive & Safe</option>
              <option value="neutral">Neutral</option>
              <option value="open">Open but Respectful</option>
            </select>
          </div>
          <div>
            <label className="block text-lg">
              <input type="checkbox" checked={useAR} onChange={e => setUseAR(e.target.checked)} /> Enable AR HoloChat
            </label>
          </div>
          <VideoChat
            avatars={selectedAvatars}
            voice={selectedVoice}
            mood={selectedMood}
            role={selectedRole}
            topic={selectedTopic}
            boundaries={boundaries}
            useAR={useAR}
          />
          <div className="mt-4">
            <p className="text-lg font-semibold">Premium Subscription: $10/month (USD)</p>
            <p className="text-sm text-gray-600">
              Pay in USD via PayPal. South African users: your bank converts to ZAR (3%–4% fee).{' '}
              <a href="#faq" className="underline">Learn more</a>
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold">One-Time Payment</h3>
                <a
                  href={process.env.NEXT_PUBLIC_PAYPAL_ME_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Pay $10 USD via PayPal
                </a>
              </div>
              <div>
                <h3 className="text-md font-semibold">Monthly Subscription</h3>
                <PayPalScriptProvider
                  options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                    components: 'buttons',
                    intent: 'subscription',
                    vault: true,
                  }}
                >
                  <PayPalButtons
                    createSubscription={createSubscription}
                    onApprove={onApprove}
                    onError={() => alert('Payment error. Try again.')}
                    style={{ layout: 'vertical' }}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p>Please log in to access Sovrya.</p>
      )}
      <footer className="mt-8 text-center text-gray-600">
        <p>Contact: support@sovrya.ai</p>
        <p>© 2025 Sovrya AI. All rights reserved.</p>
        <div id="faq" className="mt-4">
          <h3 className="text-lg font-semibold">Why USD?</h3>
          <p className="text-sm">
            Payments are in USD for global consistency. South African users: your bank/PayPal converts to ZAR with a 3%–4% fee.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SovryaChat;
