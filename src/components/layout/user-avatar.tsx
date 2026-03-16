"use client";

import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";

interface UserAvatarProps {
  user: FirebaseUser;
  size?: number;
}

function getInitials(user: FirebaseUser): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return "?";
}

export function UserAvatar({ user, size = 24 }: UserAvatarProps) {
  if (user.photoURL) {
    return (
      <Image
        src={user.photoURL}
        alt={user.displayName || "Profile"}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = getInitials(user);

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-accent text-background"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      <span className="font-semibold leading-none">{initials}</span>
    </span>
  );
}

export function UserAvatarOrIcon({ user }: { user: FirebaseUser | null }) {
  if (user) {
    return <UserAvatar user={user} size={20} />;
  }
  return <UserIcon className="h-4 w-4" />;
}
