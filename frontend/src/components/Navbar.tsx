"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageSquare, FileText } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/documents", label: "Documents", icon: FileText },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/chat" className="flex items-center gap-2 text-blue-700 font-bold text-lg">
          <BookOpen className="w-5 h-5" />
          DocKnowledge AI
        </Link>

        <div className="flex items-center gap-1 ml-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          100% Local · No API costs
        </div>
      </div>
    </nav>
  );
}
