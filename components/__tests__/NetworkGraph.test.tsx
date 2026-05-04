import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NetworkGraph from '../NetworkGraph';
import { Session } from '../../types';

describe('NetworkGraph', () => {
  it('does not render the decision bubble when decision maker equals opponent', () => {
    const setup = {
      scenarios: [],
      focalNode: 'KMT1',
      opponentNode: 'KMT2',
      sampleSize: 20,
      submissionCount: 0,
    };

    expect(() =>
      render(
        <NetworkGraph
          mode="survey"
          setup={setup as any as Session}
          decision={50}
        />
      )
    ).not.toThrow();

    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });
});
