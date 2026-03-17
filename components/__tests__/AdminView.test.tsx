import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminView from '../AdminView';
import { ExperimentSetup } from '../../types';

describe('AdminView', () => {
  it('normalizes invalid setup when decision maker equals opponent', async () => {
    const setup: ExperimentSetup = {
      activeEdgeIds: [],
      edgeConfigs: {},
      decisionMaker: 'HA',
      opponent: 'HA',
    };

    const setSetup = vi.fn();

    render(<AdminView setup={setup} setSetup={setSetup} onStart={vi.fn()} />);

    await waitFor(() => {
      expect(setSetup).toHaveBeenCalled();
    });

    const updater = setSetup.mock.calls[0][0] as (prev: ExperimentSetup) => ExperimentSetup;
    const next = updater(setup);

    expect(next.decisionMaker).toBe('HA');
    expect(next.opponent).not.toBe('HA');
  });
});
