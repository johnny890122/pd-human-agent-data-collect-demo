import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SurveyWelcome from '../SurveyWelcome';
import { CONSENT_VERSION, readConsent } from '../../utils/consent';

describe('SurveyWelcome consent (REQ-417)', () => {
  // Newer Node versions shadow jsdom's storage with their own
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('keeps 開始實驗 disabled until the box is ticked, then records the consent', () => {
    render(<MemoryRouter initialEntries={['/survey/welcome?groupId=g1&mode=mixed']}><SurveyWelcome /></MemoryRouter>);
    const start = screen.getByRole('button', { name: '開始實驗' });
    expect(start).toBeDisabled();
    expect(readConsent()).toBeNull();

    fireEvent.click(screen.getByLabelText('我已閱讀並同意參與本研究'));
    expect(start).toBeEnabled();
    fireEvent.click(start);

    const consent = readConsent();
    expect(consent?.version).toBe(CONSENT_VERSION);
    expect(Number.isNaN(Date.parse(consent?.consentedAt ?? ''))).toBe(false);
  });
});
