import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SurveyIntro from '../SurveyIntro';
import { Session } from '../../types';

describe('SurveyIntro', () => {
  const setup = {
    scenarios: [],
    focalNode: 'KMT1',
    opponentNode: 'KMT2',
    sampleSize: 20,
    submissionCount: 0,
  };

  it('uses static class names for role cards', () => {
    render(<SurveyIntro setup={setup as any as Session} onFinish={vi.fn()} />);

    expect(screen.getByText('You', { selector: 'p' })).toHaveClass('text-blue-900');
    expect(screen.getByText('Partner', { selector: 'p' })).toHaveClass('text-green-900');
  });

  it('generates unique clipPath ids for inline avatars', () => {
    render(<SurveyIntro setup={setup as any as Session} onFinish={vi.fn()} />);

    const clipPaths = Array.from(document.querySelectorAll('clipPath[id]'));
    const ids = clipPaths.map(node => node.getAttribute('id') ?? '');

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
