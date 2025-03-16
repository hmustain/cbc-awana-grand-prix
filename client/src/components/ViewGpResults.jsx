import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// Helper to format racer name as "FirstName L."
function formatRacerName(racer) {
  if (!racer) return "TBD";
  const firstName = racer.firstName || "";
  const lastInitial = racer.lastName ? racer.lastName.charAt(0) : "";
  return `${firstName} ${lastInitial}.`;
}

/**
 * Determine the top 3 finishers from the bracket data.
 * 1) If "ifNecessary" final has a winner => that's 1st; that match's loser => 2nd.
 *    Else if championship final has a winner => that's 1st; loser => 2nd.
 * 2) The LB final's loser (L5-M1 in a 12-team bracket) => 3rd.
 * 
 * Adjust as needed for your bracket design.
 */
function getPodium(bracket) {
  let first = null;
  let second = null;
  let third = null;

  // 1) Determine 1st and 2nd from finals
  const champ = bracket.finals?.championship?.match;
  const ifNec = bracket.finals?.ifNecessary?.match;

  // If the if-necessary final was actually used and has a winner
  if (ifNec && ifNec.winner) {
    first = ifNec.winner;
    second = ifNec.loser; 
  } else if (champ && champ.winner) {
    first = champ.winner;
    second = champ.loser;
  }

  // 2) For third place, look at the LB final (L5-M1).
  //    We'll assume a 12-team bracket with L5 round in losersBracket.
  if (bracket.losersBracket && bracket.losersBracket.length > 0) {
    // find the round with round===5
    const lbRound5 = bracket.losersBracket.find(r => r.round === 5);
    if (lbRound5) {
      // find the match "L5-M1"
      const lbFinal = lbRound5.matchups.find(m => m.matchId === "L5-M1");
      if (lbFinal && lbFinal.loser) {
        third = lbFinal.loser;
      }
    }
  }

  return { first, second, third };
}

function ViewGpResults() {
  const { gpId } = useParams();
  const [bracketData, setBracketData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // We'll store the actual racer objects for first/second/third
  const [firstRacer, setFirstRacer] = useState(null);
  const [secondRacer, setSecondRacer] = useState(null);
  const [thirdRacer, setThirdRacer] = useState(null);

  useEffect(() => {
    async function fetchBracket() {
      try {
        // If you have a GET route for bracket, use that:
        // e.g. GET /api/bracket/:bracketId
        const response = await axios.get(`/api/bracket/${gpId}`);
        const bracket = response.data;
        setBracketData(bracket);

        // Compute top 3
        const { first, second, third } = getPodium(bracket);
        
        // The values "first", "second", "third" are just ObjectIds of the racers
        // but since we populated them, they should be the full racer objects.
        setFirstRacer(first);
        setSecondRacer(second);
        setThirdRacer(third);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching bracket results:", err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBracket();
  }, [gpId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-white">
        Loading results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-danger">
        Error: {error}
      </div>
    );
  }

  if (!bracketData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-white">
        No bracket data available.
      </div>
    );
  }

  // We can display a podium or just a simple list
  return (
    <div
      className="min-vh-100"
      style={{
        background: `
          linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
          url('/path/to/your-podium-background.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container py-5">
        <h2 className="fw-bold mb-5 text-center text-white" style={{ textShadow: "2px 2px 5px rgba(0,0,0,0.8)" }}>
          {bracketData.grandPrix.name} - Final Results
        </h2>

        {/* A simple podium row */}
        <div className="row justify-content-center text-white">
          {/* 2nd place on the left */}
          <div className="col-12 col-md-3 d-flex flex-column align-items-center">
            <h3 style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              2nd Place
            </h3>
            <div
              style={{
                backgroundColor: "silver",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <strong style={{ fontSize: "1.2rem" }}>
                {formatRacerName(secondRacer)}
              </strong>
            </div>
          </div>

          {/* 1st place in the middle */}
          <div className="col-12 col-md-3 d-flex flex-column align-items-center">
            <h3 style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              1st Place
            </h3>
            <div
              style={{
                backgroundColor: "gold",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <strong style={{ fontSize: "1.3rem" }}>
                {formatRacerName(firstRacer)}
              </strong>
            </div>
          </div>

          {/* 3rd place on the right */}
          <div className="col-12 col-md-3 d-flex flex-column align-items-center">
            <h3 style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              3rd Place
            </h3>
            <div
              style={{
                backgroundColor: "#cd7f32", // bronze
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>
                {formatRacerName(thirdRacer)}
              </strong>
            </div>
          </div>
        </div>

        {/* Optionally, you could show more details or a final standings table */}
      </div>
    </div>
  );
}

export default ViewGpResults;
