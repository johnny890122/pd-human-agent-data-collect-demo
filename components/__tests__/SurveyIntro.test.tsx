import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SurveyIntro from '../SurveyIntro';
import { ExperimentSetup } from '../../types';

describe('SurveyIntro', () => {
  const setup: ExperimentSetup = {
    activeEdgeIds: ['1-3'],
    edgeConfigs: {},
    decisionMaker: '1',
    opponent: '3',
  };

  it('uses static class names for role cards', () => {
    render(<SurveyIntro setup={setup} onFinish={vi.fn()} />);

    expect(screen.getByText('You', { selector: 'p' })).toHaveClass('text-blue-900');
    expect(screen.getByText('Partner', { selector: 'p' })).toHaveClass('text-green-900');
  });

  it('generates unique clipPath ids for inline avatars', () => {
    render(<SurveyIntro setup={setup} onFinish={vi.fn()} />);

    const clipPaths = Array.from(document.querySelectorAll('clipPath[id]'));
    const ids = clipPaths.map(node => node.getAttribute('id') ?? '');

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
