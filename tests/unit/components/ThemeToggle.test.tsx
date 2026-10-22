import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });

  it('click chuyển sang tối rồi về sáng', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toDark = screen.getByRole('button', { name: 'Chuyển sang giao diện tối' });
    await user.click(toDark);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('đọc giao diện tối đã đặt trước khi render', async () => {
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);

    expect(
      await screen.findByRole('button', { name: 'Chuyển sang giao diện sáng' })
    ).toBeInTheDocument();
  });
});
