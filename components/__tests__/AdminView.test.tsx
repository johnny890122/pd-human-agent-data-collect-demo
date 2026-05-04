import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminView from '../AdminView';
import { SessionSetup } from '../../types';
import { fetchAllSessionSetups } from '../../utils/graphqlClient';

vi.mock('../../utils/graphqlClient', () => ({
  fetchAllSessionSetups: vi.fn().mockResolvedValue([]),
}));

const baseSetup: SessionSetup = {
  activeEdgeIds: ['A1-A2'],
  scenarios: [],
  focalNode: 'A1',
  opponentNode: 'A2',
  sampleSize: 20,
  submissionCount: 0,
};

describe('AdminView', () => {
  it('defaults to setup tab and shows config with graph guidance', () => {
    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup} setSetup={vi.fn()} onSave={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Click nodes to assign roles. Click edges to toggle factors.')).toBeInTheDocument();
  });

  it('switches to history tab and shows history table', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup} setSetup={vi.fn()} onSave={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    await waitFor(() => {
      expect(screen.getByText('Launch History & Progress')).toBeInTheDocument();
    });

    expect(screen.getByText('No history found')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.queryByText('Click nodes to assign roles. Click edges to toggle factors.')).not.toBeInTheDocument();
  });

  it('loads selected setup from history when Setup ID is clicked', async () => {
    const setSetup = vi.fn();
    const historySetup: SessionSetup = {
      id: 'setup-123',
      activeEdgeIds: ['A1-A2', 'B3-B4'],
      scenarios: [],
      focalNode: 'B3',
      opponentNode: 'A2',
      sampleSize: 30,
      submissionCount: 7,
      updatedAt: '2026-03-23T00:00:00.000Z',
    };

    vi.mocked(fetchAllSessionSetups).mockResolvedValueOnce([historySetup]);

    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup} setSetup={setSetup} onSave={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    const setupButton = await screen.findByRole('button', { name: 'setup-123' });
    fireEvent.click(setupButton);

    expect(setSetup).toHaveBeenCalledWith(historySetup);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Click nodes to assign roles. Click edges to toggle factors.')).toBeInTheDocument();
  });
});
