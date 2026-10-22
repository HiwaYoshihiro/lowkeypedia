import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamCard from '@/components/TeamCard';
import { fixtureTeam } from '../helpers/fixtures';

describe('TeamCard', () => {
  it('link tới trang đội tuyển và hiện tag, khu vực', () => {
    render(<TeamCard team={fixtureTeam} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/doi-tuyen/saigon-phantom');
    expect(screen.getByText('Saigon Phantom')).toBeInTheDocument();
    expect(screen.getByText('Việt Nam')).toBeInTheDocument();
    expect(screen.getAllByText('SGP').length).toBeGreaterThan(0);
  });

  it('meta có năm thành lập và số tuyển thủ', () => {
    render(<TeamCard team={fixtureTeam} playerCount={3} />);
    expect(screen.getByText('Thành lập 2017 • 3 tuyển thủ')).toBeInTheDocument();
  });

  it('không có năm thành lập thì meta ghi Đội tuyển', () => {
    render(<TeamCard team={{ ...fixtureTeam, founded: undefined }} playerCount={0} />);
    expect(screen.getByText('Đội tuyển • 0 tuyển thủ')).toBeInTheDocument();
  });

  it('không có tag thì không render huy hiệu tag', () => {
    render(<TeamCard team={{ ...fixtureTeam, tag: '' }} />);
    expect(screen.queryByText('SGP')).toBeNull();
  });
});
