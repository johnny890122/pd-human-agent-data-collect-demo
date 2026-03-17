import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NetworkGraph from '../NetworkGraph';
import { ExperimentSetup } from '../../types';

describe('NetworkGraph', () => {
  it('does not render the decision bubble when decision maker equals opponent', () => {
    const setup: ExperimentSetup = {
      activeEdgeIds: [],
      edgeConfigs: {},
      decisionMaker: 'HA',
      opponent: 'HA',
    };

    expect(() =>
      render(
        <NetworkGraph
          mode="survey"
          setup={setup}
          decision={50}
          nodeIdentity="avatar"
          groupLabel="named"
          roleIdentity="glow"
        />
      )
    ).not.toThrow();

    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });
});
