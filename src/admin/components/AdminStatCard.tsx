import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export default function AdminStatCard({
  label,
  value,
  description,
  icon: Icon,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-[#2b2c35] bg-[#181920] p-5 transition hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}