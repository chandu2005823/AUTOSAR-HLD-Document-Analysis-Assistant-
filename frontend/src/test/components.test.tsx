import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

describe('Common Components', () => {
  it('renders Button and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state and disables interaction', () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders Badge with custom variants', () => {
    render(<Badge variant="emerald">Verified Grounding</Badge>);
    const badge = screen.getByText('Verified Grounding');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('emerald');
  });

  it('renders Card with children', () => {
    render(
      <Card variant="elevated">
        <p>AUTOSAR Specification Content</p>
      </Card>
    );
    expect(screen.getByText('AUTOSAR Specification Content')).toBeInTheDocument();
  });
});
