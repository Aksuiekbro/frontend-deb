"use client";

import Link from "next/link";
import useSWR from "swr";
import { UserResponse } from "@/types/user/user"; // Adjust path to your types file
import { api } from "@/lib/api";

// --- The Fetcher that wraps your getMe function ---
const userFetcher = async (): Promise<UserResponse | null> => {
  try {
    const response = await api.getMe(); // This is your function

    console.log(response);

    if (response.status === 401 || response.status === 403) {
      return null; // Not logged in
    }

    if (!response.ok) {
      // SWR will catch this and put it in the `error` state
      throw new Error('Failed to fetch user');
    }

    return response.json();
  } catch (e) {
    // This could be a network error, etc.
    return null; // Treat network errors as "not logged in" for the UI
  }
};


// --- The Header Component ---
export default function Header() {
  // The key can be anything unique. "/users/me" is a good convention.
  // SWR will call `userFetcher` with this key, but we don't need to use it in our wrapper.
  const { data: user, error, isLoading } = useSWR<UserResponse | null>("/users/me", userFetcher);

  const isLoggedIn = !!user;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  return (
    <header className="flex items-center justify-between px-12 py-4">
      {/* ... The rest of your header JSX remains the same ... */}
      <div className="flex items-center space-x-16">
        <Link href="/" className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</Link>
        <nav className="flex space-x-12">
          {/* Nav Links */}
          <Link href="/join" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">Join Debates</Link>
          <Link href="/create-tournament" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">Host Debate</Link>
          <Link href="/rating" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">Rating</Link>
          <Link href="/news" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">News</Link>
        </nav>
      </div>
      <div className="flex items-center space-x-6">
        {/* Language Selector */}
        <div className="relative">
          <select
            className="border border-[#3E5C76] rounded-[8px] px-4 py-2 text-[#0D1321] bg-white text-[14px] font-medium appearance-none bg-no-repeat bg-right bg-[length:16px] pr-10 hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")' }}
          >
            <option>🇺🇸 English</option>
            <option>🇷🇺 Русский</option>
            <option>🇰🇿 Қазақша</option>
          </select>
        </div>
        {/* User Info / Auth Buttons */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center space-x-3">
              {user.imageUrl?.url ? (
                // If image URL exists, render the img tag
                <img
                  src={user.imageUrl.url}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover bg-[#9a8c98]"
                />
              ) : (
                // Otherwise, render the fallback div with initials
                <div className="w-10 h-10 bg-[#9a8c98] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {getInitials(user.firstName, user.lastName)}
                </div>
              )}
              <span className="text-[#0D1321] text-[16px] font-normal">{user.username}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth?mode=login" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-medium">Log In</Link>
              <Link href="/auth?mode=register" className="bg-[#3E5C76] text-white px-4 py-2 rounded-[8px] hover:bg-[#748CAB] transition-colors duration-200 text-[16px] font-medium shadow-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}