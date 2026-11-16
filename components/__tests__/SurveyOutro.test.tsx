import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SurveyOutro from '../SurveyOutro';
import { drawRealisedRound, fetchSubmission } from '../../utils/graphqlClient';

vi.mock('../../utils/graphqlClient', () => ({
  fetchSubmission: vi.fn(),
  drawRealisedRound: vi.fn(),
}));

// Round 2 was drawn: 您 不給 / 搭檔 給 → 3 點
const savedDebrief = {
  results: [],
  realisedRoundIndex: 1,
  opponentProbs: [0.2, 0.8],
  myDecisions: [true, false],
  opponentDecisions: [false, true],
  realisedPoints: 3,
  payoutNtd: 300,
};

const renderStep = (step: number) =>
  render(<SurveyOutro results={[]} onBack={vi.fn()} entryId="submission-1" currentStep={step} onNavigateStep={vi.fn()} />);

describe('SurveyOutro payment (REQ-408)', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the saved payout with its formula without drawing again', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue(savedDebrief as any);

    renderStep(2);

    expect(await screen.findByText('3 點 × 100 = 新台幣 300 元')).toBeInTheDocument();
    expect(screen.getByText('新台幣 300 元')).toBeInTheDocument();
    expect(screen.queryByText('參與費')).toBeNull();
    expect(drawRealisedRound).not.toHaveBeenCalled();
  });

  it('shows the participation fee that is included in the saved payout', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue({ ...savedDebrief, payoutNtd: 400 } as any);

    renderStep(2);

    expect(await screen.findByText('參與費')).toBeInTheDocument();
    expect(screen.getByText('新台幣 100 元')).toBeInTheDocument();
    expect(screen.getByText('新台幣 400 元')).toBeInTheDocument();
  });

  it('asks the server when the payout was never saved', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue({ ...savedDebrief, realisedPoints: null, payoutNtd: null } as any);
    vi.mocked(drawRealisedRound).mockResolvedValue({ ...savedDebrief } as any);

    renderStep(2);

    expect(await screen.findByText('新台幣 300 元')).toBeInTheDocument();
    expect(drawRealisedRound).toHaveBeenCalledWith('submission-1');
  });

  it('shows an error and no amount when the result cannot be loaded (REQ-408.6)', async () => {
    vi.mocked(fetchSubmission).mockRejectedValue(new Error('offline'));
    vi.mocked(drawRealisedRound).mockRejectedValue(new Error('offline'));

    renderStep(2);

    expect(await screen.findByText('讀取結果失敗')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
    expect(screen.queryByText(/元/)).toBeNull();
  });

  it('repeats the amount on the email step', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue(savedDebrief as any);

    renderStep(3);

    expect(await screen.findByText('新台幣 300 元')).toBeInTheDocument();
  });
});

describe('SurveyOutro registration code (REQ-403.1, BUG-009)', () => {
  // Newer Node versions shadow jsdom's localStorage with their own (undefined without a file)
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    cleanup();
  });

  const props = (step: number, onComplete = vi.fn(), onNavigateStep = vi.fn()) => ({
    results: [], onBack: vi.fn(), entryId: 'submission-1', currentStep: step, onComplete, onNavigateStep,
  });

  it('keeps the code entered on step 1 across a refresh and submits it', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue(savedDebrief as any);
    const first = render(<SurveyOutro {...props(1)} />);
    fireEvent.change(screen.getByPlaceholderText('請輸入代碼'), { target: { value: 'E2E001' } });
    first.unmount(); // the page reload

    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<SurveyOutro {...props(3, onComplete)} />);
    await screen.findByText('新台幣 300 元');
    fireEvent.change(screen.getByPlaceholderText('您的 Email'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][2]).toMatchObject({ gender: 'E2E001', education: 'a@example.com' });
    await vi.waitFor(() => expect(store.has('survey_code_submission-1')).toBe(false));
  });

  it('sends the participant back to step 1 instead of saving without a code', async () => {
    vi.mocked(fetchSubmission).mockResolvedValue(savedDebrief as any);
    const onComplete = vi.fn();
    const onNavigateStep = vi.fn();
    render(<SurveyOutro {...props(3, onComplete, onNavigateStep)} />);
    await screen.findByText('新台幣 300 元');
    fireEvent.change(screen.getByPlaceholderText('您的 Email'), { target: { value: 'a@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(onNavigateStep).toHaveBeenCalledWith(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
