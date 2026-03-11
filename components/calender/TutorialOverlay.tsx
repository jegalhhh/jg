'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'jg-calendar-tutorial-seen';

const slides = [
  {
    emoji: '📅',
    title: '캘린더 보는 법',
    description: '노란 점이 있는 날엔 확정된 일정이 있어요.\n노란 테두리가 있는 날이 오늘이에요.',
    detail: '← 화살표로 월을 이동할 수 있어요',
  },
  {
    emoji: '👆',
    title: '날짜를 클릭하세요',
    description: '원하는 날짜를 클릭하면\n시간 선택 패널이 열려요.',
    detail: '비회원도 날짜 클릭이 가능해요',
  },
  {
    emoji: '🟨',
    title: '시간 블록 선택',
    description: '30분 단위 블록을 원하는 만큼\n클릭해서 시간을 선택하세요.',
    detail: '회색 블록은 이미 예약된 시간이에요 (클릭 불가)',
  },
  {
    emoji: '📬',
    title: '요청 보내기',
    description: '할일을 입력하고 요청을 보내면\n아래 큐에 쌓여요.',
    detail: '관리자가 수락하면 일정이 확정돼요 ✅',
  },
];

export function TutorialOverlay() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const go = (next: number) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const prev = () => current > 0 && go(current - 1);
  const next = () => current < slides.length - 1 && go(current + 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-foreground/10 bg-background/95 shadow-2xl backdrop-blur-sm"
          >
            {/* 상단 하이라이트 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />

            {/* 닫기 버튼 */}
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 hover:bg-foreground/10 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 슬라이드 영역 */}
            <div className="relative h-64 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -60, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="absolute inset-0 flex flex-col items-center justify-center px-8 pt-8 pb-4 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-4 text-6xl select-none"
                  >
                    {slides[current].emoji}
                  </motion.div>
                  <h3 className="text-lg font-extrabold">{slides[current].title}</h3>
                  <p className="mt-2 text-sm text-foreground/60 whitespace-pre-line leading-relaxed">
                    {slides[current].description}
                  </p>
                  <p className="mt-2 text-xs text-foreground/35">{slides[current].detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 하단 컨트롤 */}
            <div className="flex items-center justify-between border-t border-foreground/8 px-5 py-4">
              {/* 이전 */}
              <button
                onClick={prev}
                disabled={current === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 hover:bg-foreground/10 hover:text-foreground disabled:opacity-20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dot indicator */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className="transition-all duration-300"
                  >
                    <span
                      className={`block rounded-full transition-all duration-300 ${
                        i === current
                          ? 'h-2 w-5 bg-yellow-400'
                          : 'h-2 w-2 bg-foreground/20 hover:bg-foreground/40'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* 다음 / 시작하기 */}
              {current < slides.length - 1 ? (
                <button
                  onClick={next}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={close}
                  className="rounded-xl bg-foreground px-4 py-1.5 text-xs font-bold text-background hover:bg-foreground/80 transition-colors"
                >
                  시작하기
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
