import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NotificationQueryDto } from './notification-query.dto';

describe('NotificationQueryDto', () => {
  it('parses unreadOnly=false as boolean false', () => {
    const dto = plainToInstance(NotificationQueryDto, { unreadOnly: 'false' });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.unreadOnly).toBe(false);
  });

  it('parses unreadOnly=true as boolean true', () => {
    const dto = plainToInstance(NotificationQueryDto, { unreadOnly: 'true' });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.unreadOnly).toBe(true);
  });
});
