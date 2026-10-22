import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KindBadge, RoleBadge, TeamStatusBadge } from '@/components/Badges';

describe('Badges', () => {
  it('RoleBadge gắn đúng lớp màu theo vị trí', () => {
    render(<RoleBadge role="Đi Rừng" />);
    expect(screen.getByText('Đi Rừng')).toHaveClass('badge', 'badge-role', 'role-di-rung');
  });

  it('RoleBadge lạ dùng màu mặc định', () => {
    render(<RoleBadge role="Vị trí khác" />);
    expect(screen.getByText('Vị trí khác')).toHaveClass('role-duong-giua');
  });

  it('TeamStatusBadge hiện tên đội khi có', () => {
    render(<TeamStatusBadge teamName="Saigon Phantom" />);
    expect(screen.getByText('Saigon Phantom')).toHaveClass('badge-active');
  });

  it('TeamStatusBadge hiện Tự do khi không có đội', () => {
    render(<TeamStatusBadge teamName={null} />);
    expect(screen.getByText('Tự do')).toHaveClass('badge-inactive');
  });

  it('KindBadge ánh xạ nhãn tiếng Việt cho từng loại', () => {
    render(
      <>
        <KindBadge kind="player" />
        <KindBadge kind="team" />
        <KindBadge kind="tournament" />
        <KindBadge kind="video" />
      </>
    );

    expect(screen.getByText('Tuyển thủ')).toBeInTheDocument();
    expect(screen.getByText('Đội tuyển')).toBeInTheDocument();
    expect(screen.getByText('Giải đấu')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
  });
});
