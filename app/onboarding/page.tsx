'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingPage() {
  const { user, profile, loading, updateProfile, uploadAvatar } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
    if (!loading && profile?.onboarded) {
      router.replace('/');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
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
      let avatarUrl: string | undefined;
      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }
      await updateProfile({ name: name.trim(), avatar_url: avatarUrl, onboarded: true });
      router.push('/');
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? JSON.stringify(err);
      console.error('onboarding error:', msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

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
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex flex-grow items-center justify-center w-full">
        {/* Yellow circle decoration */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute h-[280px] w-[280px] rounded-full bg-yellow-400/90 blur-sm sm:h-[360px] sm:w-[360px]"
        />

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative z-10 w-full max-w-sm"
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
              설정
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-foreground/60">
              한 번만 설정하면 됩니다
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
                  <img src={previewUrl} alt="미리보기" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-foreground/40 text-xs">사진</span>
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground/60 hover:border-foreground/40 hover:text-foreground/80 transition-colors"
                >
                  사진 선택 (선택)
                </button>
                <p className="mt-1 text-xs text-foreground/40">프로필 사진은 나중에도 변경할 수 있어요</p>
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
              {submitting ? '저장 중...' : '시작하기 →'}
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
