import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminView from '../AdminView';
import { Session } from '../../types';
import { fetchAllSessions } from '../../utils/graphqlClient';

vi.mock('../../utils/graphqlClient', () => ({
  fetchAllSessions: vi.fn().mockResolvedValue([]),
}));

const baseSetup = {
  scenarios: [],
  focalNode: 'KMT1',
  opponentNode: 'KMT2',
  sampleSize: 20,
  submissionCount: 0,
};

describe('AdminView', () => {
  it('defaults to setup tab and shows config with graph guidance', () => {
    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup as any as Session} setSetup={vi.fn()} onSave={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Click nodes to assign roles. Click edges to toggle factors.')).toBeInTheDocument();
  });

  it('switches to history tab and shows history table', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup as any as Session} setSetup={vi.fn()} onSave={vi.fn()} />
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
    const historySetup = {
      scenarios: [],
      focalNode: 'DPP3',
      opponentNode: 'KMT2',
      sampleSize: 30,
      submissionCount: 7,
      updatedAt: '2026-03-23T00:00:00.000Z',
    };

    vi.mocked(fetchAllSessions).mockResolvedValueOnce([historySetup as any as Session]);

    render(
      <MemoryRouter initialEntries={['/admin/setup']}>
        <AdminView setup={baseSetup as any as Session} setSetup={setSetup} onSave={vi.fn()} />
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
