import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'rrweb-player/dist/style.css';
import rrwebPlayer from 'rrweb-player';

const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql';

export const SessionPlayback: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId) return;

    let isCancelled = false;

    const fetchReplay = async () => {
      try {
        const response = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetSessionReplay($sessionId: String!) {
                getSessionReplay(sessionId: $sessionId)
              }
            `,
            variables: { sessionId },
          }),
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const events = result.data.getSessionReplay;

        if (!events) {
          throw new Error('No replay data found for this session.');
        }

        if (events.length < 2) {
          throw new Error('Not enough events recorded to play back this session.');
        }


        if (!isCancelled && playerRef.current) {
          // React Strict Mode might run this twice, so clean up the container first
          playerRef.current.innerHTML = '';
          playerInstanceRef.current = new rrwebPlayer({
            target: playerRef.current,
            props: {
              events,
            },
          });
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Error loading session replay');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchReplay();

    return () => {
      isCancelled = true; // Prevent async promise from mounting player to unmounted or re-rendered component
      // Cleanup player if necessary
      if (playerRef.current) {
        playerRef.current.innerHTML = '';
      }
    };
  }, [sessionId]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link to="/admin/setup" className="text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">Session Replay: {sessionId}</h2>

      {loading && <p className="text-gray-500">Loading replay data...</p>}
      {error && <p className="text-red-500 bg-red-100 p-4 rounded">{error}</p>}

      <div
        ref={playerRef}
        className="mt-8 border border-gray-300 rounded shadow-md overflow-hidden bg-white"
        style={{ minHeight: '400px' }}
      ></div>
    </div>
  );
};

export default SessionPlayback;
