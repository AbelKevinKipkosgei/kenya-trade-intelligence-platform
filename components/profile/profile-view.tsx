"use client";

import { useState } from "react";
import Image from "next/image";
import type { UserRole } from "@/db/schema";
import { ProfileEditForm } from "./profile-edit-form";
import { NotificationPreferences } from "./notification-preferences";
import { AccountSecurity } from "./account-security";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  // Only ever set for OAuth-signed-in users (Google, LinkedIn, GitHub,
  // Facebook — see lib/auth.ts); null for credentials-only accounts.
  image: string | null;
  // Never the hash itself — see app/profile/page.tsx for why passwordHash
  // is deliberately excluded from what's queried and passed down here.
  hasPassword: boolean;
}

interface Profile {
  id: number;
  userId: number;
  businessType: string | null;
  businessRegistrationNumber: string | null;
  primarySectorId: number | null;
  countiesOfOperation: unknown;
  agencyId: number | null;
  department: string | null;
  officerLevel: string | null;
  bio: string | null;
}

interface Sector {
  id: number;
  name: string;
}

interface Agency {
  id: number;
  name: string;
  code: string;
}

interface County {
  id: number;
  name: string;
  region: string;
}

interface ProfileViewProps {
  user: User;
  profile: Profile | null;
  sector: Sector | null;
  agency: Agency | null;
  counties: County[];
  linkedProviders: string[];
}

export function ProfileView({
  user,
  profile,
  sector,
  agency,
  counties,
  linkedProviders,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const formatRole = (role: UserRole) => {
    const roleMap = {
      public: "Public User",
      exporter: "Exporter",
      importer: "Importer",
      officer: "Trade Officer",
      admin: "Administrator",
    };
    return roleMap[role] || role;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isEditing) {
    return (
      <ProfileEditForm
        user={user}
        profile={profile}
        sector={sector}
        agency={agency}
        counties={counties}
        onCancel={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kenya-green/10 text-xl font-semibold text-kenya-green dark:bg-kenya-green/20">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                Account Information
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Your basic account details
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex h-9 items-center gap-2 border border-kenya-green bg-kenya-green px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Full Name
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
              {user.fullName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Email Address
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
              {user.email}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Account Type
            </label>
            <div className="mt-1 inline-block rounded bg-kenya-green/10 px-2 py-1 text-sm font-semibold text-kenya-green dark:bg-kenya-green/20">
              {formatRole(user.role)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Member Since
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <AccountSecurity hasPassword={user.hasPassword} linkedProviders={linkedProviders} />

      {/* Notification Preferences */}
      <NotificationPreferences userId={user.id} profile={profile} />

      {/* Role-specific Profile */}
      {profile && (user.role === "exporter" || user.role === "importer") && (
        <div className="border-t-4 border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Business Profile
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {profile.businessType && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Business Type
                </label>
                <p className="mt-1 text-sm font-medium capitalize text-zinc-950 dark:text-white">
                  {profile.businessType}
                </p>
              </div>
            )}

            {sector && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Primary Sector
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
                  {sector.name}
                </p>
              </div>
            )}

            {profile.businessRegistrationNumber && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Registration Number
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
                  {profile.businessRegistrationNumber}
                </p>
              </div>
            )}

            {counties.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Counties of Operation
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {counties.map((county) => (
                    <span
                      key={county.id}
                      className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {county.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  About Business
                </label>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {profile && user.role === "officer" && (
        <div className="border-t-4 border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Officer Profile
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {agency && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Agency
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
                  {agency.name}
                </p>
              </div>
            )}

            {profile.department && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Department
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-white">
                  {profile.department}
                </p>
              </div>
            )}

            {profile.officerLevel && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Operational Level
                </label>
                <p className="mt-1 text-sm font-medium capitalize text-zinc-950 dark:text-white">
                  {profile.officerLevel} Level
                </p>
              </div>
            )}

            {profile.bio && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Role Description
                </label>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!profile && (
        <div className="border-t-4 border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add more details to personalize your experience on the platform.
          </p>
          <a
            href="/onboarding"
            className="mt-4 inline-flex h-9 items-center border border-kenya-green bg-kenya-green px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
          >
            Complete Profile Setup
          </a>
        </div>
      )}
    </div>
  );
}
