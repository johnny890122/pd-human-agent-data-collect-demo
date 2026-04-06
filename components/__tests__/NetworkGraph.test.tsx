import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NetworkGraph from '../NetworkGraph';
import { SessionSetup } from '../../types';

describe('NetworkGraph', () => {
  it('does not render the decision bubble when decision maker equals opponent', () => {
    const setup: SessionSetup = {
      activeEdgeIds: [],
      scenarios: [],
      focalNode: 'A1',
      opponentNode: 'A2',
      sampleSize: 20,
      submissionCount: 0,
    };

    expect(() =>
      render(
        <NetworkGraph
          mode="survey"
          setup={setup}
          decision={50}
        />
      )
    ).not.toThrow();

    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });
});
