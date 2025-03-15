// src/components/ViewBrackets.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ViewBrackets() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBracket() {
      try {
        const resp = await axios.post('/api/bracket/generateFull', { grandPrixId: gpId });
        setBracketData(resp.data.bracket);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bracket:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBracket();
  }, [gpId]);

  // When bracketData is loaded, render the bracket into a DOM element (e.g., #bracket-container)
  useEffect(() => {
    if (bracketData && window.bracketsViewer) {
      // Adjust these keys to match how your backend returns the bracket
      window.bracketsViewer.render(
        {
          stages: bracketData.stage,         // e.g. bracketData.stage
          matches: bracketData.match,        // e.g. bracketData.match
          matchGames: bracketData.match_game,// e.g. bracketData.match_game
          participants: bracketData.participant,
        },
        '#bracket-container' // The CSS selector of the container where the bracket is rendered
      );
    }
  }, [bracketData]);

  if (loading) return <div style={{ color: '#fff' }}>Loading bracket...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!bracketData) return <div style={{ color: '#fff' }}>No bracket data found.</div>;

  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#fff', padding: '1rem' }}>
      <h2 className="text-center">Double Elimination Bracket</h2>
      {/* The viewer will render the bracket into this container */}
      <div id="bracket-container" style={{ overflowX: 'auto' }} />
    </div>
  );
}

export default ViewBrackets;
