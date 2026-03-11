'use client';

import { blockToLabel } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface TimeBlockGridProps {
  occupiedBlocks: Set<number>;
  selectedBlocks: Set<number>;
  onBlockToggle: (index: number) => void;
  disabled?: boolean;
  startHour?: number; // 표시 시작 시간 (기본 0)
  endHour?: number;   // 표시 종료 시간 (기본 24)
}

export function TimeBlockGrid({
  occupiedBlocks,
  selectedBlocks,
  onBlockToggle,
  disabled = false,
  startHour = 0,
  endHour = 24,
}: TimeBlockGridProps) {
  const startBlock = startHour * 2;
  const endBlock = endHour * 2;
  const blocks = Array.from({ length: endBlock - startBlock }, (_, i) => startBlock + i);

  return (
    <div className="flex flex-col gap-0.5">
      {blocks.map(i => {
        const isOccupied = occupiedBlocks.has(i);
        const isSelected = selectedBlocks.has(i);
        const isHourStart = i % 2 === 0;

        return (
          <button
            key={i}
            type="button"
            disabled={isOccupied || disabled}
            onClick={() => !isOccupied && !disabled && onBlockToggle(i)}
            className={cn(
              'relative flex h-7 w-full items-center rounded-md px-2 text-left text-xs transition-colors',
              isHourStart ? 'mt-0.5' : '',
              isOccupied
                ? 'cursor-not-allowed bg-foreground/15 text-foreground/30'
                : isSelected
                ? 'bg-yellow-400/90 text-foreground font-medium cursor-pointer'
                : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10 cursor-pointer'
            )}
          >
            <span className="w-10 shrink-0 font-mono">{blockToLabel(i)}</span>
            {isOccupied && (
              <span className="ml-1 text-[10px] text-foreground/40">예약됨</span>
            )}
            {isSelected && !isOccupied && (
              <span className="ml-1 text-[10px]">선택됨</span>
            )}
            {/* 시각적 구분선 (정시마다) */}
            {isHourStart && (
              <span className="absolute inset-x-0 top-0 h-px bg-foreground/10" />
            )}
          </button>
        );
      })}
    </div>
  );
}
