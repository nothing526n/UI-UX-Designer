import {
  CodeSnapshotContent,
  CodeDiffContent,
  ScreenContent,
  DesignSystemContent,
} from "@platform/contracts";
import { codeConnectRegistry } from "../registry/code-connect-registry.js";

export class FrontendCodeAgent {
  public async generateCodeSnapshot(
    screen: ScreenContent,
    designSystem: DesignSystemContent
  ): Promise<{ snapshot: CodeSnapshotContent; diff: CodeDiffContent }> {
    const pageTsx = this.generatePageTsx(screen);
    const layoutTsx = this.generateLayoutTsx();
    const globalsCss = this.generateGlobalsCss();
    const tailwindConfig = this.generateTailwindConfig();
    const manifestJson = JSON.stringify(codeConnectRegistry.exportManifest(), null, 2);

    const snapshot: CodeSnapshotContent = {
      framework: "nextjs",
      targetPlatform: "web",
      entrypoint: "app/page.tsx",
      files: [
        {
          path: "app/page.tsx",
          content: pageTsx,
          language: "typescript",
          ownership: "generated",
          sourceArtifactRef: screen.screenId,
        },
        {
          path: "app/layout.tsx",
          content: layoutTsx,
          language: "typescript",
          ownership: "generated",
        },
        {
          path: "app/globals.css",
          content: globalsCss,
          language: "css",
          ownership: "generated",
        },
        {
          path: "tailwind.config.js",
          content: tailwindConfig,
          language: "javascript",
          ownership: "generated",
        },
        {
          path: "code-connect.manifest.json",
          content: manifestJson,
          language: "json",
          ownership: "generated",
        },
        {
          path: "components/ui/button.tsx",
          content: this.generateButtonTsx(),
          language: "typescript",
          ownership: "generated",
        },
        {
          path: "components/ui/card.tsx",
          content: this.generateCardTsx(),
          language: "typescript",
          ownership: "generated",
        },
        {
          path: "components/ui/badge.tsx",
          content: this.generateBadgeTsx(),
          language: "typescript",
          ownership: "generated",
        },
        {
          path: "components/ui/input.tsx",
          content: this.generateInputTsx(),
          language: "typescript",
          ownership: "generated",
        },
      ],
      dependencies: {
        next: "14.2.5",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "lucide-react": "^0.428.0",
        clsx: "^2.1.1",
        "tailwind-merge": "^2.5.2",
      },
      devDependencies: {
        typescript: "^5.5.4",
        tailwindcss: "^3.4.7",
        autoprefixer: "^10.4.19",
        postcss: "^8.4.40",
      },
    };


    const diff: CodeDiffContent = {
      changeId: `diff_${Date.now()}`,
      summary: `Synthesized production Next.js 14 App Router code from screen '${screen.title}'`,
      risk: "LOW",
      diffs: [
        {
          filePath: "app/page.tsx",
          operation: "CREATE",
          newContent: pageTsx,
          unifiedDiff: `--- /dev/null\n+++ b/app/page.tsx\n@@ -0,0 +1,${pageTsx.split("\n").length} @@\n${pageTsx
            .split("\n")
            .map((l) => `+${l}`)
            .join("\n")}`,
        },
      ],
      sourceArtifactRefs: [screen.screenId],
    };

    return { snapshot, diff };
  }

  private generatePageTsx(screen: ScreenContent): string {
    return `"use client";

import React, { useState } from "react";
import { 
  Zap, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const records = [
    {
      id: "REC-9402",
      location: "Northwest Logistics Center",
      status: "In Transit",
      note: "On Schedule",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      needsAttention: false,
    },
    {
      id: "REC-9403",
      location: "Metro Cross-Dock Terminal",
      status: "Exception Alert",
      note: "Driver Reroute Required",
      statusColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      needsAttention: true,
    },
    {
      id: "REC-9404",
      location: "Central Cargo Hub",
      status: "Pending Dispatch",
      note: "Awaiting Gate Pass",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      needsAttention: true,
    },
    {
      id: "REC-9405",
      location: "Eastern Express Waypoint",
      status: "Delivered",
      note: "Signed by Recipient",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      needsAttention: false,
    },
  ];

  const filteredRecords = records.filter((r) => {
    if (filter === "attention" && !r.needsAttention) return false;
    if (searchQuery && !r.location.toLowerCase().includes(searchQuery.toLowerCase()) && !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F3F6FC] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[#121520] border-b border-[#1E2538] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">\${screen.title.replace(/'/g, "\\\\'")}</span>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Pipeline Active
          </Badge>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Entry
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Block */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operational Command Center</h1>
          <p className="text-sm text-[#9DA8C3] mt-1">High-performance real-time telemetry, routing exceptions, and pipeline dispatch.</p>
        </div>

        {/* 4x KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 hover:border-[#2D3752]">
            <div className="flex items-center justify-between text-xs text-[#9DA8C3] font-medium">
              <span>Total Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">14,892</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">+12.4% vs last week</div>
          </Card>

          <Card className="p-5 hover:border-[#2D3752]">
            <div className="flex items-center justify-between text-xs text-[#9DA8C3] font-medium">
              <span>Active Exceptions</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">23</div>
            <div className="text-xs text-rose-400 mt-1 font-medium">3 require urgent review</div>
          </Card>

          <Card className="p-5 hover:border-[#2D3752]">
            <div className="flex items-center justify-between text-xs text-[#9DA8C3] font-medium">
              <span>Average SLA</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">4m 12s</div>
            <div className="text-xs text-indigo-400 mt-1 font-medium">-18s faster cycle</div>
          </Card>

          <Card className="p-5 hover:border-[#2D3752]">
            <div className="flex items-center justify-between text-xs text-[#9DA8C3] font-medium">
              <span>Automation Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">98.2%</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">+1.5% optimized</div>
          </Card>
        </div>

        {/* Data Table Section */}
        <Card className="p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Active Dispatch Pipeline</h2>
              <p className="text-xs text-[#9DA8C3] mt-0.5">Real-time status of items in distribution network</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-[#9DA8C3] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search code or hub..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex items-center bg-[#1A1F30] p-1 rounded-lg border border-[#2D3752]">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={\`px-3 py-1 text-xs rounded-md font-medium transition-all \${
                    filter === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-[#9DA8C3] hover:text-white"
                  }\`}
                >
                  All ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("attention")}
                  className={\`px-3 py-1 text-xs rounded-md font-medium transition-all \${
                    filter === "attention" ? "bg-rose-600 text-white shadow-sm" : "text-[#9DA8C3] hover:text-white"
                  }\`}
                >
                  Needs Attention (2)
                </button>
              </div>
            </div>
          </div>


          {/* Table Rows */}
          <div className="space-y-2">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="group flex items-center justify-between p-3.5 rounded-lg bg-[#161B29] hover:bg-[#1A1F30] border border-[#1E2538] hover:border-[#2D3752] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {r.id}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {r.location}
                    </div>
                    <div className="text-xs text-[#9DA8C3]">{r.note}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={\`text-xs px-2.5 py-1 rounded-md font-medium border \${r.statusColor}\`}>
                    {r.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#606D8C] group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
`;
  }

  private generateLayoutTsx(): string {
    return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI UI/UX Platform Studio",
  description: "Generated by AI UI/UX Designer & Design-to-Code Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090A0F] text-[#F3F6FC] antialiased">{children}</body>
    </html>
  );
}
`;
  }

  private generateGlobalsCss(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-canvas: #090A0F;
  --bg-surface: #121520;
  --bg-elevated: #1A1F30;
  --border-subtle: #1E2538;
  --border-strong: #2D3752;
  --text-primary: #F3F6FC;
  --text-secondary: #9DA8C3;
  --text-muted: #606D8C;
  --accent-primary: #6366F1;
  --accent-hover: #4F46E5;
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
}

body {
  background-color: var(--bg-canvas);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
      },
    },
  },
  plugins: [],
};
`;
  }

  private generateButtonTsx(): string {
    return `"use client";

import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    default: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm",
    secondary: "bg-[#1A1F30] hover:bg-[#242B42] text-white border border-[#2D3752]",
    outline: "border border-[#2D3752] hover:bg-[#1A1F30] text-[#F3F6FC]",
    ghost: "hover:bg-[#1A1F30] text-[#9DA8C3] hover:text-white",
    destructive: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm",
  }[variant];

  const sizeStyles = {
    default: "h-9 px-4 py-2 text-xs",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-6 text-sm",
    icon: "h-9 w-9 p-0",
  }[size];

  return (
    <button
      className={\`inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none \${variantStyles} \${sizeStyles} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}
`;
  }

  private generateCardTsx(): string {
    return `import * as React from "react";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={\`rounded-xl bg-[#121520] border border-[#1E2538] transition-all \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
}
`;
  }

  private generateBadgeTsx(): string {
    return `import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className = "", variant = "outline", children, ...props }: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    destructive: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    outline: "bg-[#1A1F30] text-[#F3F6FC] border-[#2D3752]",
  }[variant];

  return (
    <span
      className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border \${variantStyles} \${className}\`}
      {...props}
    >
      {children}
    </span>
  );
}
`;
  }

  private generateInputTsx(): string {
    return `"use client";

import * as React from "react";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={\`bg-[#1A1F30] border border-[#2D3752] text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors w-full placeholder:text-[#606D8C] \${className}\`}
      {...props}
    />
  );
}
`;
  }
}

