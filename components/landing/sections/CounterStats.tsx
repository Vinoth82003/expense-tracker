"use client";

import { useEffect, useState, useRef } from "react";
import {
  Users,
  IndianRupee,
  Star,
  FileText,
} from "lucide-react";

interface PublicStats {
  totalUsers: number;
  totalExpenses: number;
  avgRating: number | null;
  ratingCount: number;
}

function useCountUp(end: number, duration = 1800, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * end);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return {
    ref,
    value: decimals > 0 ? value.toFixed(decimals) : Math.round(value),
  };
}

function formatExpenses(count: number): string {
  if (count >= 10000000) return `${(count / 10000000).toFixed(1)}Cr`;
  if (count >= 100000) return `${(count / 100000).toFixed(1)}L`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const CounterStat = ({
  icon: Icon,
  value,
  suffix,
  label,
  decimals,
}: {
  icon: any;
  value: number;
  suffix: string;
  label: string;
  decimals: number;
}) => {
  const { ref, value: count } = useCountUp(value, 1800, decimals);
  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center gap-2 min-w-0"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 shrink-0">
        <Icon size={18} />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
        {count}
        {suffix}
      </div>
      <div className="text-xs text-muted font-medium">{label}</div>
    </div>
  );
};

export function CounterStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const totalUsers = stats?.totalUsers ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const avgRating = stats?.avgRating ?? 0;
  const ratingCount = stats?.ratingCount ?? 0;

  const counterItems = [
    {
      icon: Users,
      value: totalUsers,
      suffix: "+",
      label: "Active Users",
      decimals: 0,
    },
    {
      icon: IndianRupee,
      value: totalExpenses,
      suffix: "+",
      label: "Expenses Tracked",
      decimals: 0,
      format: true,
    },
    {
      icon: FileText,
      value: ratingCount,
      suffix: "+",
      label: "Reviews",
      decimals: 0,
    },
    {
      icon: Star,
      value: avgRating,
      suffix: "/5",
      label: "User Rating",
      decimals: 1,
    },
  ];

  return (
    <section className="border-y border-border-subtle bg-surface py-12 md:py-16 px-5 md:px-10">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        {counterItems.map((ci) => (
          <CounterStat
            key={ci.label}
            icon={ci.icon}
            value={ci.value}
            suffix={ci.suffix}
            label={ci.label}
            decimals={ci.decimals}
          />
        ))}
      </div>
    </section>
  );
}
