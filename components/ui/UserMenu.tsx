'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return <div className="h-9 w-9 rounded-full bg-foreground/10 animate-pulse" />;
  }

  if (!user) {
    return (
      <a
        href="/auth"
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-all duration-300 hover:bg-foreground/80"
      >
        로그인
      </a>
    );
  }

  const initial = (profile?.name ?? profile?.email ?? 'U')[0].toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center focus:outline-none"
        aria-label="프로필 메뉴"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="프로필"
            className="h-9 w-9 rounded-full object-cover border-2 border-foreground/20 hover:border-foreground/60 transition-colors"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/90 text-sm font-bold border-2 border-foreground/20 hover:border-foreground/60 transition-colors">
            {initial}
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-foreground/10 bg-background p-1.5 shadow-lg"
          >
            <div className="px-3 py-2 border-b border-foreground/10 mb-1">
              <p className="text-xs font-medium text-foreground truncate">{profile?.name ?? '사용자'}</p>
              <p className="text-xs text-foreground/40 truncate">{profile?.email}</p>
            </div>
            <a
              href="/mypage"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
            >
              마이페이지
            </a>
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
            >
              로그아웃
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
