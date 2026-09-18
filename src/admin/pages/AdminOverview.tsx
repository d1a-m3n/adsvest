import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Wallet,
  Clock3,
} from "lucide-react";

import AdminStatCard from "../components/AdminStatCard";

interface RecentUser {
  id: number;
  name: string | null;
  email: string;
  membershipStatus: string;
  createdAt: string;
}

interface RecentWithdrawal {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface AdminOverviewData {
  stats: {
    totalUsers: number;
    activeMembers: number;
    availableBalance: string | number;
    pendingWithdrawals: number;
  };
  recentUsers: RecentUser[];
  recentWithdrawals: RecentWithdrawal[];
}

export default function AdminOverview() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/overview",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load admin overview",
          );
        }

        setData(result.data);
      } catch (error) {
        console.error("Failed to fetch admin overview:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load admin overview",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
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

  const getMembershipLabel = (status: string) => {
    if (status === "ACTIVE") return "Active";
    if (status === "EXPIRED") return "Expired";
    if (status === "CANCELLED") return "Cancelled";

    return "Inactive";
  };

  const getWithdrawalLabel = (status: string) => {
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    if (status === "PAID") return "Paid";

    return "Pending";
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Overview
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Here's what's happening on Advest today.
          </p>
        </div>

        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#2b2c35] bg-[#181920]">
          <p className="text-sm text-gray-400">
            Loading admin overview...
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
            Overview
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Here's what's happening on Advest today.
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-[#181920] p-6">
          <p className="text-sm text-red-400">
            {error || "Unable to load admin overview."}
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: data.stats.totalUsers.toLocaleString(),
      description: "Registered users",
      icon: Users,
    },
    {
      label: "Active Members",
      value: data.stats.activeMembers.toLocaleString(),
      description: "Currently subscribed",
      icon: UserCheck,
    },
    {
      label: "Available Balance",
      value: formatCurrency(data.stats.availableBalance),
      description: "Combined user wallet balance",
      icon: Wallet,
    },
    {
      label: "Pending Withdrawals",
      value: data.stats.pendingWithdrawals.toLocaleString(),
      description: "Awaiting review",
      icon: Clock3,
    },
  ];

  const recentUsers = data.recentUsers.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Overview
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Here's what's happening on Advest today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Recent Users */}
      <div className="mt-8 rounded-2xl border border-[#2b2c35] bg-[#181920]">
        <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
          <div>
            <h2 className="font-semibold text-white">
              Recent Users
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Recently registered users on Advest.
            </p>
          </div>

          <Link
            to="/admin/dashboard/users"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            View all
          </Link>
        </div>

        <div className="admin-table-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>

            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {user.name || "Unnamed User"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.membershipStatus === "ACTIVE"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {getMembershipLabel(user.membershipStatus)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Withdrawals */}
      <div className="mt-8 rounded-2xl border border-[#2b2c35] bg-[#181920]">
        <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
          <div>
            <h2 className="font-semibold text-white">
              Recent Withdrawals
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Latest withdrawal requests on Advest.
            </p>
          </div>

          <Link
            to="/admin/dashboard/withdrawals"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            View all
          </Link>
        </div>

        <div className="admin-table-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>

            <tbody>
              {data.recentWithdrawals.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No withdrawals yet.
                  </td>
                </tr>
              ) : (
                data.recentWithdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {withdrawal.user.name || "Unnamed User"}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-300">
                      {formatCurrency(withdrawal.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          withdrawal.status === "APPROVED" ||
                          withdrawal.status === "PAID"
                            ? "bg-green-500/10 text-green-400"
                            : withdrawal.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {getWithdrawalLabel(withdrawal.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(withdrawal.createdAt)}
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
