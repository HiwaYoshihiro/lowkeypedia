import { describe, expect, it } from 'vitest';
import { KIND_HREF, KIND_LABEL, KIND_ORDER } from '@/lib/entities';

describe('entities', () => {
  it('ánh xạ đúng URL chi tiết cho từng loại', () => {
    expect(KIND_HREF.player('lai-bang')).toBe('/tuyen-thu/lai-bang');
    expect(KIND_HREF.team('saigon-phantom')).toBe('/doi-tuyen/saigon-phantom');
    expect(KIND_HREF.tournament('aic-2025')).toBe('/giai-dau/aic-2025');
  });

  it('có nhãn tiếng Việt cho từng loại', () => {
    expect(KIND_LABEL.player).toBe('Tuyển thủ');
    expect(KIND_LABEL.team).toBe('Đội tuyển');
    expect(KIND_LABEL.tournament).toBe('Giải đấu');
  });

  it('giữ thứ tự nhóm ổn định', () => {
    expect(KIND_ORDER).toEqual(['player', 'team', 'tournament']);
  });
});
