'use client';

import { MinimalistHero } from '@/components/main/hero';
import { UserMenu } from '@/components/ui/UserMenu';
import { Code2, Camera, Send } from 'lucide-react';

export default function Home() {
  return (
    <MinimalistHero
      logoText="JG"
      navLinks={[
        { label: 'ABOUT', href: '#about' },
        { label: 'WORK', href: '#work' },
        { label: 'CONTACT', href: '#contact' },
      ]}
      mainText="약속 잡기 버튼을 클릭한 후 제갈민혁과 약속을 잡아보세요. 늦기 전에 약속 시간을 쟁취하세요!"
      readMoreLink="/calender"
      imageSrc="/jg.png"
      imageAlt="Profile"
      overlayText={{
        part1: '제갈민혁과',
        part2: '약속 잡기',
      }}
      socialLinks={[
        { icon: Code2, href: 'https://github.com/jegalhhh' },
        { icon: Camera, href: '#' },
        { icon: Send, href: '#' },
      ]}
      locationText="Seoul, Korea"
      headerAction={<UserMenu />}
    />
  );
}
