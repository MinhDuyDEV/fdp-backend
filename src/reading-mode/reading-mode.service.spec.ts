import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import { ModeOverrideStore } from './mode-override.store';
import { ReadingModeService } from './reading-mode.service';
import type { RenderResult } from './strategies/reading-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';

describe('ReadingModeService', () => {
  let service: ReadingModeService;
  let overrideStore: ModeOverrideStore;

  const mockContext = {
    setStrategy: jest.fn<void, [string]>(),
    getCurrentMode: jest.fn<string, []>(),
    validateMode: jest.fn<string, [string]>(),
    render: jest.fn<RenderResult, [string]>(),
    renderWithMode: jest.fn<RenderResult, [string, string]>(),
    getAvailableModes: jest.fn<string[], []>(),
  };

  const mockProgressService = {
    getProgress: jest.fn(),
    updateReadingMode: jest.fn(),
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
            store: ModeOverrideStore,
          ) => new ReadingModeService(context, progressService, store),
          inject: [
            ReadingModeContext,
            ReadingProgressService,
            ModeOverrideStore,
          ],
        },
        {
          provide: ReadingModeContext,
          useValue: mockContext,
        },
        {
          provide: ReadingProgressService,
          useValue: mockProgressService,
        },
        ModeOverrideStore,
      ],
    }).compile();

    service = module.get<ReadingModeService>(ReadingModeService);
    overrideStore = module.get<ModeOverrideStore>(ModeOverrideStore);
  });

  describe('setMode', () => {
    it('validates mode, persists story-scoped mode, and returns current mode', async () => {
      mockContext.validateMode.mockReturnValue('night');
      mockProgressService.updateReadingMode.mockResolvedValue(1);

      const result = await service.setMode(1, 'night', 10);

      expect(mockContext.validateMode).toHaveBeenCalledWith('night');
      expect(mockProgressService.updateReadingMode).toHaveBeenCalledWith(
        1,
        'night',
        10,
      );
      expect(result).toBe('night');
    });

    it('stores in-memory override when no story-scoped reading progress exists yet', async () => {
      mockContext.validateMode.mockReturnValue('night');
      mockProgressService.updateReadingMode.mockResolvedValue(0);

      const result = await service.setMode(1, 'night', 10);

      expect(result).toBe('night');
      expect(overrideStore.get(ModeOverrideStore.makeKey(1, 10))).toBe('night');
    });

    it('supports legacy mode updates without storyId using in-memory override only', async () => {
      mockContext.validateMode.mockReturnValue('scroll');

      const result = await service.setMode(1, 'scroll');

      expect(mockProgressService.updateReadingMode).not.toHaveBeenCalled();
      expect(result).toBe('scroll');
      expect(overrideStore.get(ModeOverrideStore.makeKey(1))).toBe('scroll');
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

    it("defaults to 'day' when progress is not found and no override exists", async () => {
      mockProgressService.getProgress.mockRejectedValue(
        new NotFoundException('No reading progress found'),
      );

      const result = await service.getModeForUser(2, 20);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(2, 20);
      expect(result).toBe('day');
    });

    it('returns a story-scoped override when progress is not found', async () => {
      mockContext.validateMode.mockReturnValue('night');
      mockProgressService.updateReadingMode.mockResolvedValue(0);
      await service.setMode(2, 'night', 20);
      mockProgressService.getProgress.mockRejectedValue(
        new NotFoundException('No reading progress found'),
      );

      const result = await service.getModeForUser(2, 20);

      expect(result).toBe('night');
    });

    it('returns a legacy user-scoped override when storyId-specific progress is not found', async () => {
      mockContext.validateMode.mockReturnValue('page-flip');
      await service.setMode(3, 'page-flip');
      mockProgressService.getProgress.mockRejectedValue(
        new NotFoundException('No reading progress found'),
      );

      const result = await service.getModeForUser(3, 99);

      expect(result).toBe('page-flip');
    });

    it('rethrows unexpected progress lookup errors', async () => {
      const dbError = new Error('database unavailable');
      mockProgressService.getProgress.mockRejectedValue(dbError);

      await expect(service.getModeForUser(2, 20)).rejects.toBe(dbError);
    });
  });

  describe('render', () => {
    it('uses explicit mode when provided', async () => {
      const renderResult: RenderResult = {
        content: 'styled-content',
        mode: 'night',
        styles: { background: '#000' },
      };
      mockContext.validateMode.mockReturnValue('night');
      mockContext.renderWithMode.mockReturnValue(renderResult);

      const result = await service.render('chapter-content', 'night');

      expect(mockContext.validateMode).toHaveBeenCalledWith('night');
      expect(mockProgressService.getProgress).not.toHaveBeenCalled();
      expect(mockContext.renderWithMode).toHaveBeenCalledWith(
        'chapter-content',
        'night',
      );
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
      mockContext.renderWithMode.mockReturnValue(renderResult);

      const result = await service.render('chapter-content', undefined, 5, 50);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(5, 50);
      expect(mockContext.renderWithMode).toHaveBeenCalledWith(
        'chapter-content',
        'scroll',
      );
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
