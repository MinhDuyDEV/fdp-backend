import { Test, TestingModule } from '@nestjs/testing';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import { ReadingModeService } from './reading-mode.service';
import { ReadingModeContext } from './strategies/reading-mode-context';
import type { RenderResult } from './strategies/reading-mode.strategy';

describe('ReadingModeService', () => {
  let service: ReadingModeService;

  const mockContext = {
    setStrategy: jest.fn<void, [string]>(),
    getCurrentMode: jest.fn<string, []>(),
    render: jest.fn<RenderResult, [string]>(),
    getAvailableModes: jest.fn<string[], []>(),
  };

  const mockProgressService = {
    getProgress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ReadingModeService,
          useFactory: (
            context: ReadingModeContext,
            progressService: ReadingProgressService,
          ) => new ReadingModeService(context, progressService),
          inject: [ReadingModeContext, ReadingProgressService],
        },
        {
          provide: ReadingModeContext,
          useValue: mockContext,
        },
        {
          provide: ReadingProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();

    service = module.get<ReadingModeService>(ReadingModeService);
  });

  describe('setMode', () => {
    it('calls context.setStrategy and returns current mode', () => {
      mockContext.getCurrentMode.mockReturnValue('night');

      const result = service.setMode(1, 'night');

      expect(mockContext.setStrategy).toHaveBeenCalledWith('night');
      expect(mockContext.getCurrentMode).toHaveBeenCalledTimes(1);
      expect(result).toBe('night');
    });
  });

  describe('getModeForUser', () => {
    it('returns saved mode from reading progress', async () => {
      mockProgressService.getProgress.mockResolvedValue({
        readingMode: 'scroll',
      });

      const result = await service.getModeForUser(1, 10);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(1, 10);
      expect(result).toBe('scroll');
    });

    it("defaults to 'day' when progress lookup fails", async () => {
      mockProgressService.getProgress.mockRejectedValue(new Error('not found'));

      const result = await service.getModeForUser(2, 20);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(2, 20);
      expect(result).toBe('day');
    });
  });

  describe('render', () => {
    it('uses explicit mode when provided', async () => {
      const renderResult: RenderResult = {
        content: 'styled-content',
        mode: 'night',
        styles: { background: '#000' },
      };
      mockContext.render.mockReturnValue(renderResult);

      const result = await service.render('chapter-content', 'night');

      expect(mockContext.setStrategy).toHaveBeenCalledWith('night');
      expect(mockProgressService.getProgress).not.toHaveBeenCalled();
      expect(mockContext.render).toHaveBeenCalledWith('chapter-content');
      expect(result).toEqual(renderResult);
    });

    it('resolves user mode from progress when mode is not provided', async () => {
      const renderResult: RenderResult = {
        content: 'styled-content',
        mode: 'scroll',
        styles: { overflow: 'auto' },
      };
      mockProgressService.getProgress.mockResolvedValue({
        readingMode: 'scroll',
      });
      mockContext.render.mockReturnValue(renderResult);

      const result = await service.render('chapter-content', undefined, 5, 50);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(5, 50);
      expect(mockContext.setStrategy).toHaveBeenCalledWith('scroll');
      expect(mockContext.render).toHaveBeenCalledWith('chapter-content');
      expect(result).toEqual(renderResult);
    });
  });

  describe('getCurrentMode', () => {
    it('delegates to context.getCurrentMode', () => {
      mockContext.getCurrentMode.mockReturnValue('page-flip');

      const result = service.getCurrentMode();

      expect(mockContext.getCurrentMode).toHaveBeenCalledTimes(1);
      expect(result).toBe('page-flip');
    });
  });

  describe('getAvailableModes', () => {
    it('delegates to context.getAvailableModes', () => {
      mockContext.getAvailableModes.mockReturnValue([
        'day',
        'night',
        'scroll',
        'page-flip',
      ]);

      const result = service.getAvailableModes();

      expect(mockContext.getAvailableModes).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['day', 'night', 'scroll', 'page-flip']);
    });
  });
});
