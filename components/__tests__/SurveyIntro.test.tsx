import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SurveyIntro from '../SurveyIntro';
import { GraphLegend, FigureCaption } from '../SurveyShared';
import { Session } from '../../types';
import { MAX_TOTAL_NTD, MIN_TOTAL_NTD, PAYMENT_METHOD_TEXT } from '../../utils/payment.js';

describe('SurveyIntro', () => {
  const setup = {
    scenarios: [],
    focalNode: 'KMT1',
    opponentNode: 'DPP3',
    sampleSize: 20,
    submissionCount: 0,
  } as any as Session;

  const renderStep = (step: number) =>
    render(
      <MemoryRouter>
        <SurveyIntro setup={setup} currentStep={step} onFinish={vi.fn()} />
      </MemoryRouter>
    );

  it('explains the roles figure with a caption and legend (REQ-409.1, REQ-409.2)', () => {
    renderStep(0);

    expect(screen.getByText(/圖中的四個頭像代表四位參與者/)).toBeInTheDocument();
    expect(screen.getByText('圖例')).toBeInTheDocument();
    expect(screen.getByText('國民黨／民進黨')).toBeInTheDocument();
  });

  it('states the conversion, outcomes, range and payment form (REQ-408.2)', () => {
    renderStep(7);

    expect(screen.getByText('1 點 = 新台幣 100 元')).toBeInTheDocument();
    // Header row + one row per outcome
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByText(/報酬最少為/)).toBeInTheDocument();
    expect(screen.getAllByText(`新台幣 ${MIN_TOTAL_NTD} 元`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`新台幣 ${MAX_TOTAL_NTD} 元`).length).toBeGreaterThan(0);
    expect(screen.getByText(PAYMENT_METHOD_TEXT)).toBeInTheDocument();
  });

  it('generates unique clipPath ids for inline avatars', () => {
    renderStep(2);

    const clipPaths = Array.from(document.querySelectorAll('clipPath[id]'));
    const ids = clipPaths.map(node => node.getAttribute('id') ?? '');

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('GraphLegend', () => {
  it('renders only the requested rows', () => {
    render(<GraphLegend items={['give', 'unrevealed']} />);

    expect(screen.getByText('給予')).toBeInTheDocument();
    expect(screen.getByText('尚未查看')).toBeInTheDocument();
    expect(screen.queryByText('搭檔')).toBeNull();
  });

  it('is closed until the header is tapped (REQ-409.5)', () => {
    render(<GraphLegend items={['give']} />);
    const details = screen.getByText('圖例').closest('details')!;

    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('給予')).not.toBeVisible();
    fireEvent.click(screen.getByText('圖例'));
    expect(details).toHaveAttribute('open');
  });
});

describe('FigureCaption', () => {
  it('is closed until the header is tapped (REQ-409.5)', () => {
    render(<FigureCaption>說明文字</FigureCaption>);
    const details = screen.getByText('圖說').closest('details')!;

    expect(details).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('圖說'));
    expect(details).toHaveAttribute('open');
    expect(screen.getByText('說明文字')).toBeVisible();
  });
});
