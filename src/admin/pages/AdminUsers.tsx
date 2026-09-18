import {
  Search,
  MoreVertical,
  Eye,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  createdAt: string;

  membershipStatus:
    | "INACTIVE"
    | "ACTIVE"
    | "EXPIRED"
    | "CANCELLED";

  accountStatus: "ACTIVE" | "SUSPENDED";

  membershipExpiresAt: string | null;
  referralCount: number;
  totalEarnings: number;
  walletBalance: number;
  walletCurrency: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);
  const [confirmUser, setConfirmUser] =
    useState<AdminUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(
          "http://localhost:5000/api/admin/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch users"
          );
        }

        setUsers(result.data);
      } catch (error) {
        console.error("Failed to fetch admin users:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch users"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        user.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        user.membershipStatus.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMembership = (
    status: AdminUser["membershipStatus"]
  ) => {
    return (
      status.charAt(0) + status.slice(1).toLowerCase()
    );
  };

  const getMembershipClasses = (
    status: AdminUser["membershipStatus"]
  ) => {
    if (status === "ACTIVE") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "EXPIRED") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    if (status === "CANCELLED") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-gray-500/10 text-gray-400";
  };

  const getAccountStatusClasses = (
    status: AdminUser["accountStatus"]
  ) => {
    if (status === "ACTIVE") {
      return "bg-green-500/10 text-green-400";
    }

    return "bg-red-500/10 text-red-400";
  };

  const formatAccountStatus = (
    status: AdminUser["accountStatus"]
  ) => {
    return status === "ACTIVE" ? "Active" : "Suspended";
  };

  const formatCurrency = (
    amount: number,
    currency: string
  ) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const updateUserStatus = async (
    user: AdminUser
  ): Promise<boolean> => {
    const nextStatus =
      user.accountStatus === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    const action =
      nextStatus === "SUSPENDED"
        ? "suspend"
        : "activate";

    try {
      setActionLoading(true);
      setActionMessage("");
      setActionError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${user.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountStatus: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${action} user`
        );
      }

      const updatedUser: AdminUser = {
        ...user,
        accountStatus: result.data.accountStatus,
      };

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? updatedUser
            : currentUser
        )
      );

      setSelectedUser((currentSelectedUser) =>
        currentSelectedUser?.id === user.id
          ? updatedUser
          : currentSelectedUser
      );

      setActionMessage(result.message);

      return true;
    } catch (error) {
      console.error(
        "Failed to update user account status:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} user`
      );

      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Main page */}
      <div>
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Manage registered Advest users.
          </p>
        </div>

        {/* Feedback */}
        {(actionMessage || actionError) && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              actionMessage
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {actionMessage || actionError}
          </div>
        )}

        {/* Search and filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#2b2c35] bg-[#181920] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-[#2b2c35] bg-[#181920] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="all">All users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Users table */}
        <div className="overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920]">
          <div className="border-b border-[#2b2c35] px-6 py-5">
            <h2 className="font-semibold text-white">
              Registered Users ({filteredUsers.length})
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              View and manage users registered on Advest.
            </p>
          </div>

          <div className="admin-table-scroll overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                  <th className="px-6 py-4 font-medium">
                    User
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Membership
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Account
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Referrals
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Joined
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-red-400"
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.name || "Unnamed User"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getMembershipClasses(
                            user.membershipStatus
                          )}`}
                        >
                          {formatMembership(
                            user.membershipStatus
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getAccountStatusClasses(
                            user.accountStatus
                          )}`}
                        >
                          {formatAccountStatus(
                            user.accountStatus
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.referralCount}{" "}
                        {user.referralCount === 1
                          ? "referral"
                          : "referrals"}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="relative px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === user.id
                                ? null
                                : user.id
                            )
                          }
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-400"
                          aria-label={`Actions for ${
                            user.name || user.email
                          }`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* User action menu */}
                        {openMenu === user.id && (
                          <div className="absolute right-6 top-14 z-20 w-48 overflow-hidden rounded-xl border border-[#2b2c35] bg-[#181920] py-1 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setSelectedUser(user);
                                setActionMessage("");
                                setActionError("");
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <Eye size={17} />
                              <span>View User</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setConfirmUser(user);
                                setActionMessage("");
                                setActionError("");
                              }}
                              disabled={actionLoading}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                user.accountStatus ===
                                "ACTIVE"
                                  ? "text-red-400 hover:bg-red-500/10"
                                  : "text-green-400 hover:bg-green-500/10"
                              }`}
                            >
                              <span>
                                {user.accountStatus ===
                                "ACTIVE"
                                  ? "Suspend User"
                                  : "Activate User"}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  User Details
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  View account information and activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* User information */}
            <div className="max-h-[75vh] overflow-y-auto p-6">
              {/* Profile */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#2b2c35] bg-[#0f1015] p-5 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400">
                  {(selectedUser.name || "User")
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser.name || "Unnamed User"}
                  </h3>

                  <p className="truncate text-sm text-gray-400">
                    {selectedUser.email}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getMembershipClasses(
                        selectedUser.membershipStatus
                      )}`}
                    >
                      Membership:{" "}
                      {formatMembership(
                        selectedUser.membershipStatus
                      )}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getAccountStatusClasses(
                        selectedUser.accountStatus
                      )}`}
                    >
                      Account:{" "}
                      {formatAccountStatus(
                        selectedUser.accountStatus
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account information */}
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Account Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Registration Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Email Status
                    </p>

                    <p
                      className={`mt-1 text-sm font-medium ${
                        selectedUser.emailVerified
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selectedUser.emailVerified
                        ? "Verified"
                        : "Not verified"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Membership
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {formatMembership(
                        selectedUser.membershipStatus
                      )}
                    </p>

                    {selectedUser.membershipExpiresAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        Expires{" "}
                        {formatDate(
                          selectedUser.membershipExpiresAt
                        )}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Account Status
                    </p>

                    <p
                      className={`mt-1 text-sm font-medium ${
                        selectedUser.accountStatus ===
                        "ACTIVE"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatAccountStatus(
                        selectedUser.accountStatus
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Referral Activity
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {selectedUser.referralCount}{" "}
                      {selectedUser.referralCount === 1
                        ? "referral"
                        : "referrals"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Phone Number
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {selectedUser.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial summary */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Financial Summary
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Total Earnings
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatCurrency(
                        selectedUser.totalEarnings,
                        selectedUser.walletCurrency
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Wallet Balance
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatCurrency(
                        selectedUser.walletBalance,
                        selectedUser.walletCurrency
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Referrals
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {selectedUser.referralCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Account Activity
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-200">
                        Account created
                      </p>

                      <p className="text-xs text-gray-500">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>

                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-200">
                        Email verification
                      </p>

                      <p className="text-xs text-gray-500">
                        {selectedUser.emailVerified
                          ? "Email verified"
                          : "Email not verified"}
                      </p>
                    </div>

                    <span
                      className={`h-2 w-2 rounded-full ${
                        selectedUser.emailVerified
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmUser(selectedUser);
                    setActionMessage("");
                    setActionError("");
                  }}
                  disabled={actionLoading}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedUser.accountStatus ===
                    "ACTIVE"
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  }`}
                >
                  {actionLoading
                    ? "Updating..."
                    : selectedUser.accountStatus ===
                        "ACTIVE"
                      ? "Suspend User"
                      : "Activate User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            <div className="p-6">
              {/* Icon */}
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                  confirmUser.accountStatus === "ACTIVE"
                    ? "bg-red-500/10"
                    : "bg-green-500/10"
                }`}
              >
                <span
                  className={`text-2xl ${
                    confirmUser.accountStatus === "ACTIVE"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {confirmUser.accountStatus === "ACTIVE"
                    ? "!"
                    : "✓"}
                </span>
              </div>

              {/* Heading */}
              <div className="mt-5 text-center">
                <h2 className="text-lg font-semibold text-white">
                  {confirmUser.accountStatus === "ACTIVE"
                    ? "Suspend User?"
                    : "Activate User?"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Are you sure you want to{" "}
                  {confirmUser.accountStatus === "ACTIVE"
                    ? "suspend"
                    : "activate"}{" "}
                  <span className="font-medium text-gray-200">
                    {confirmUser.name || "this user"}
                  </span>
                  ?
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {confirmUser.email}
                </p>
              </div>

              {/* Warning / information */}
              <div
                className={`mt-5 rounded-xl border p-4 ${
                  confirmUser.accountStatus === "ACTIVE"
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-green-500/20 bg-green-500/5"
                }`}
              >
                <p
                  className={`text-sm leading-5 ${
                    confirmUser.accountStatus === "ACTIVE"
                      ? "text-red-300"
                      : "text-green-300"
                  }`}
                >
                  {confirmUser.accountStatus === "ACTIVE"
                    ? "This will prevent the user from accessing their Advest account until an admin activates the account again."
                    : "This will restore the user's ability to access their Advest account."}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmUser(null)}
                  className="flex-1 rounded-xl border border-[#2b2c35] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    const success =
                      await updateUserStatus(confirmUser);

                    if (success) {
                      setConfirmUser(null);
                    }
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    confirmUser.accountStatus === "ACTIVE"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {actionLoading
                    ? "Updating..."
                    : confirmUser.accountStatus === "ACTIVE"
                      ? "Suspend User"
                      : "Activate User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}