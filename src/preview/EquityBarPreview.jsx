import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import EquityBar from '../components/EquityBar.jsx';

const PreviewCard = ({ title, caption, children }) => (
  <div
    style={{
      backgroundColor: 'var(--bg-surface-elevated)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      border: '1px solid rgba(200, 160, 60, 0.15)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: 'var(--space-6)',
    }}
  >
    <h3
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        marginBottom: 'var(--space-4)',
        fontStyle: 'italic',
      }}
    >
      {caption}
    </p>
    <div style={{ marginTop: 'var(--space-4)' }}>
      {children}
    </div>
  </div>
);

const EquityBarPreview = () => {
  const scenarios = [
    {
      title: 'The Nut Flush Draw',
      caption: 'As9s on Ts6s3d, facing a half-pot bet',
      props: {
        mode: 'draw',
        drawEquityPct: 19.6,
        breakEvenPct: 25.0,
        showdownEquityPct: 85.8,
        verdict: 'call',
        note: 'Short on this-street equity, but implied odds bridge the tiny gap — CALL.',
      },
    },
    {
      title: 'The Monster Draw',
      caption: 'Ts9s on Js8s2c, flush + open-ender',
      props: {
        mode: 'draw',
        drawEquityPct: 32.6,
        breakEvenPct: 29.0,
        showdownEquityPct: 56.8,
        verdict: 'call',
        note: 'Draw equity clears the price outright — easy CALL.',
      },
    },
    {
      title: 'The All-In Coin Flip',
      caption: 'AsKs vs QQ, all-in pre-flop',
      props: {
        mode: 'allin',
        showdownEquityPct: 46.3,
        breakEvenPct: 37.4,
        verdict: 'call',
        note: 'All-in: showdown equity 46% beats the 37% price — +EV CALL.',
      },
    },
    {
      title: 'Overpair vs Flush Board',
      caption: 'KsKc on Th6h3d2h, villain bets the flush card',
      props: {
        mode: 'draw',
        drawEquityPct: 0,
        breakEvenPct: 30.4,
        showdownEquityPct: 0,
        verdict: 'fold',
        note: 'Drawing dead — even a King makes only trips, which loses to the flush. FOLD.',
      },
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        padding: 'var(--space-8)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            textAlign: 'center',
          }}
        >
          EquityBar
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: 'var(--space-12)',
            fontStyle: 'italic',
          }}
        >
          2-bar reveal design
        </p>

        {scenarios.map((scenario, idx) => (
          <PreviewCard
            key={idx}
            title={scenario.title}
            caption={scenario.caption}
          >
            <EquityBar {...scenario.props} />
          </PreviewCard>
        ))}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<EquityBarPreview />);
