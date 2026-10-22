import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TournamentCard from '@/components/TournamentCard';
import { fixtureTournament } from '../helpers/fixtures';

describe('TournamentCard', () => {
  it('link tới trang giải đấu theo slug', () => {
    render(<TournamentCard tournament={fixtureTournament} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/giai-dau/aic-2025');
    expect(screen.getByText('AIC 2025')).toBeInTheDocument();
    expect(screen.getByText('Garena')).toBeInTheDocument();
    expect(screen.getByText('Hằng năm • Việt Nam')).toBeInTheDocument();
  });

  it('thiếu ban tổ chức thì hiện nhãn thay thế', () => {
    render(<TournamentCard tournament={{ ...fixtureTournament, organizer: '' }} />);
    expect(screen.getByText('Chưa rõ ban tổ chức')).toBeInTheDocument();
  });
});
