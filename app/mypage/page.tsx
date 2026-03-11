'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { UserMenu } from '@/components/ui/UserMenu';

export default function MyPage() {
  const { user, profile, loading, updateProfile, uploadAvatar } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPreviewUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let avatarUrl = profile?.avatar_url ?? undefined;
      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }
      await updateProfile({ name: name.trim(), avatar_url: avatarUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const initial = (profile?.name ?? profile?.email ?? 'U')[0].toUpperCase();

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-between overflow-hidden bg-background p-8 font-sans md:p-12">
      {/* Header */}
      <header className="z-30 flex w-full max-w-7xl items-center justify-between">
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold tracking-wider"
        >
          JG
        </motion.a>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <UserMenu />
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex flex-grow items-center justify-center w-full">
        {/* Yellow circle — 오른쪽 아래 배경 장식 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute -bottom-20 -right-20 h-[320px] w-[320px] rounded-full bg-yellow-400/70 blur-2xl sm:h-[420px] sm:w-[420px]"
        />

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative z-10 w-full max-w-sm rounded-3xl border border-foreground/8 bg-background p-8 shadow-sm"
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
              프로필
              <br />
              편집
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-foreground/60">
              {profile?.email}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="flex items-center gap-4"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors flex items-center justify-center"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="프로필" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-foreground/60">{initial}</span>
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground/60 hover:border-foreground/40 hover:text-foreground/80 transition-colors"
                >
                  사진 변경
                </button>
                <p className="mt-1 text-xs text-foreground/40">JPG, PNG, WebP 지원</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </motion.div>

            {/* Name input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
            >
              <input
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-full border border-foreground/20 bg-background px-5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-foreground/60 focus:outline-none transition-colors"
              />
            </motion.div>

            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-300 hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="z-30 flex w-full max-w-7xl items-center justify-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-sm font-medium text-foreground/80"
        >
          Seoul, Korea
        </motion.div>
      </footer>
    </div>
  );
}
