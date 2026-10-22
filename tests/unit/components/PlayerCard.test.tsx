import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayerCard from '@/components/PlayerCard';
import { fixturePlayer } from '../helpers/fixtures';

describe('PlayerCard', () => {
  it('link tới trang tuyển thủ theo slug', () => {
    render(<PlayerCard player={fixturePlayer} teamName="Saigon Phantom" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/tuyen-thu/lai-bang');
    expect(screen.getByText('Lai Bâng')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Đi Rừng')).toBeInTheDocument();
    expect(screen.getByText('Saigon Phantom')).toBeInTheDocument();
  });

  it('không có đội hiện huy hiệu Tự do', () => {
    render(<PlayerCard player={fixturePlayer} />);
    expect(screen.getByText('Tự do')).toHaveClass('badge-inactive');
  });

  it('không có tên thật thì phụ đề là quốc tịch', () => {
    render(<PlayerCard player={{ ...fixturePlayer, realName: undefined }} />);
    expect(screen.getByText('Việt Nam')).toBeInTheDocument();
  });
});
