import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminView from '../AdminView';
import { Session } from '../../types';

vi.mock('../../utils/graphqlClient', () => ({
  clearDatabase: vi.fn(),
  createMixedGroup: vi.fn(),
}));

const baseSetup = { scenarios: [], focalNode: 'KMT1', opponentNode: 'KMT2', sampleSize: 20, submissionCount: 0 };

// Mirrors the admin routes in App.tsx (REQ-207, REQ-208).
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/setup/manual" element={<Navigate to="/admin/setup/mixed" replace />} />
        <Route path="/admin/view/manual" element={<Navigate to="/admin/view/batch" replace />} />
        <Route path="/admin/*" element={<AdminView setup={baseSetup as any as Session} setSetup={vi.fn()} />} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminView', () => {
  it('nav has Setup and View Sessions only', () => {
    renderAt('/admin/setup/mixed');
    expect(screen.getByRole('button', { name: 'Setup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Sessions' })).toBeInTheDocument();
    expect(screen.queryByText('View Single Session')).not.toBeInTheDocument();
    expect(screen.queryByText('View Batch Sessions')).not.toBeInTheDocument();
  });

  it('setup page is Batch only, with no Launch Mode toggle', () => {
    renderAt('/admin/setup/mixed');
    expect(screen.getByRole('button', { name: 'Launch Batch Sessions' })).toBeInTheDocument();
    expect(screen.queryByText('Launch Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Manual')).not.toBeInTheDocument();
  });

  it('old manual URLs redirect', () => {
    renderAt('/admin/setup/manual');
    expect(screen.getByRole('button', { name: 'Launch Batch Sessions' })).toBeInTheDocument();
  });
});
