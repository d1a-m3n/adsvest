import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock3,
  Wallet,
} from "lucide-react";
import { API_URL } from "../../config";

interface ReferralUser {
  id: number;
  name: string | null;
  email: string;
}

interface ReferredUser extends ReferralUser {
  membershipStatus: string;
}

interface Referral {
  id: number;
  status: string;
  rewardAmount: string | number;
  rewardPaid: boolean;
  rewardedAt: string | null;
  createdAt: string;
  referrer: ReferralUser;
  referredUser: ReferredUser;
}

interface AdminReferralsData {
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingReferrals: number;
    totalRewards: string | number;
  };
  referrals: Referral[];
}

export default function AdminReferrals() {
  const [data, setData] = useState<AdminReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReferrals = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/admin/referrals`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load referrals",
          );
        }

        setData(result.data);
      } catch (error) {
        console.error("Failed to fetch admin referrals:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load referrals",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const formatCurrency = (amount: string | number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string) => {
    if (status === "ACTIVE") return "Active";
    if (status === "PENDING") return "Pending";
    if (status === "INACTIVE") return "Inactive";

    return status;
  };

  const stats = data
    ? [
        {
          label: "Total Referrals",
          value: data.stats.totalReferrals.toLocaleString(),
          description: "All referral records",
          icon: Users,
        },
        {
          label: "Active Referrals",
          value: data.stats.activeReferrals.toLocaleString(),
          description: "Subscribed referrals",
          icon: UserCheck,
        },
        {
          label: "Pending Referrals",
          value: data.stats.pendingReferrals.toLocaleString(),
          description: "Awaiting activation",
          icon: Clock3,
        },
        {
          label: "Total Rewards",
          value: formatCurrency(data.stats.totalRewards),
          description: "Rewards paid to referrers",
          icon: Wallet,
        },
      ]
    : [];

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Referrals
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Monitor Advest referral activity.
          </p>
        </div>

        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#2b2c35] bg-[#181920]">
          <p className="text-sm text-gray-400">
            Loading referrals...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Referrals
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Monitor Advest referral activity.
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-[#181920] p-6">
          <p className="text-sm text-red-400">
            {error || "Unable to load referrals."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Referrals
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Monitor Advest referral activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#2b2c35] bg-[#181920] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Referral Table */}
      <div className="mt-8 rounded-2xl border border-[#2b2c35] bg-[#181920]">
        <div className="border-b border-[#2b2c35] px-6 py-5">
          <h2 className="font-semibold text-white">
            Referral Activity
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            View users who joined Advest through referrals.
          </p>
        </div>

        <div className="admin-table-scroll overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                <th className="px-6 py-4 font-medium">
                  Referrer
                </th>

                <th className="px-6 py-4 font-medium">
                  Referred User
                </th>

                <th className="px-6 py-4 font-medium">
                  Status
                </th>

                <th className="px-6 py-4 font-medium">
                  Reward
                </th>

                <th className="px-6 py-4 font-medium">
                  Reward Status
                </th>

                <th className="px-6 py-4 font-medium">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {data.referrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No referral activity yet.
                  </td>
                </tr>
              ) : (
                data.referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                  >
                    {/* Referrer */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {referral.referrer.name ||
                          "Unnamed User"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {referral.referrer.email}
                      </p>
                    </td>

                    {/* Referred User */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {referral.referredUser.name ||
                          "Unnamed User"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {referral.referredUser.email}
                      </p>
                    </td>

                    {/* Referral Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          referral.status === "ACTIVE"
                            ? "bg-green-500/10 text-green-400"
                            : referral.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {getStatusLabel(referral.status)}
                      </span>
                    </td>

                    {/* Reward */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-300">
                      {formatCurrency(
                        referral.rewardAmount,
                      )}
                    </td>

                    {/* Reward Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          referral.rewardPaid
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {referral.rewardPaid
                          ? "Paid"
                          : "Pending"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(referral.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}