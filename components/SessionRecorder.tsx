import React, { useEffect, useRef } from 'react';
import * as rrweb from 'rrweb';

const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql';

export const SessionRecorder: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const eventsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    // Generate or retrieve session ID
    sessionStorage.setItem('rrweb-session-id', sessionId);

    const stopRecording = rrweb.record({
      emit(event) {
        eventsRef.current.push(event);
      },
    });

    const intervalId = setInterval(() => {
      const events = eventsRef.current;
      if (events.length > 0) {
        // Create a copy and clear buffer
        const eventsToSend = [...events];
        eventsRef.current = [];

        const bodyString = JSON.stringify({
          query: `
            mutation SaveSession($sessionId: String!, $events: [JSON!]!) {
              saveSessionEvents(sessionId: $sessionId, events: $events)
            }
          `,
          variables: { sessionId, events: eventsToSend },
        });

        fetch(graphqlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyString,
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.errors) {
              console.error('Failed to save session events:', result.errors);
              // Optionally re-queue failed events
            }
          })
          .catch((err) => {
            console.error('GraphQL mutation error:', err);
            // Put events back on failure (basic resilience)
            eventsRef.current = [...eventsToSend, ...eventsRef.current];
          });
      }
    }, 5000); // 5-10 seconds per requirements

    return () => {
      if (stopRecording) {
        stopRecording();
      }
      clearInterval(intervalId);
    };
  }, [sessionId]);

  return null;
};
