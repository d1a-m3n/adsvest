import {
  Search,
  MoreVertical,
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

type Withdrawal = {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
  };
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [withdrawalToReject, setWithdrawalToReject] =
    useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const token = localStorage.getItem("token");

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/withdrawals",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch withdrawals");
      }

      setWithdrawals(data.data);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (status: WithdrawalStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((withdrawal) => {
      const userName = withdrawal.user.name ?? "";
      const userEmail = withdrawal.user.email ?? "";

      const matchesSearch =
        userName.toLowerCase().includes(search.toLowerCase()) ||
        userEmail.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        withdrawal.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, search, statusFilter]);

  const pendingCount = withdrawals.filter(
    (withdrawal) => withdrawal.status === "PENDING"
  ).length;

  const approvedCount = withdrawals.filter(
    (withdrawal) => withdrawal.status === "APPROVED"
  ).length;

  const rejectedCount = withdrawals.filter(
    (withdrawal) => withdrawal.status === "REJECTED"
  ).length;

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      setActionLoading(withdrawal.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/withdrawals/${withdrawal.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "APPROVED",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to approve withdrawal");
      }

      setOpenMenu(null);
      setSelectedWithdrawal(null);

      await fetchWithdrawals();
    } catch (error) {
      console.error("Failed to approve withdrawal:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to approve withdrawal"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (withdrawal: Withdrawal) => {
    setOpenMenu(null);
    setSelectedWithdrawal(null);
    setWithdrawalToReject(withdrawal);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!withdrawalToReject) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      setActionLoading(withdrawalToReject.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/withdrawals/${withdrawalToReject.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "REJECTED",
            rejectionReason: reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reject withdrawal");
      }

      setShowRejectModal(false);
      setWithdrawalToReject(null);
      setRejectionReason("");

      await fetchWithdrawals();
    } catch (error) {
      console.error("Failed to reject withdrawal:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to reject withdrawal"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (withdrawal: Withdrawal) => {
    try {
      setActionLoading(withdrawal.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/withdrawals/${withdrawal.id}/paid`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to mark withdrawal as paid");
      }

      setOpenMenu(null);
      setSelectedWithdrawal(null);

      await fetchWithdrawals();
    } catch (error) {
      console.error("Failed to mark withdrawal as paid:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to mark withdrawal as paid"
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div>
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Withdrawals
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Review and manage user withdrawal requests.
          </p>
        </div>

        {/* Withdrawal stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#2b2c35] bg-[#181920] p-5">
            <p className="text-sm font-medium text-gray-400">
              Pending
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {pendingCount}
            </p>

            <p className="mt-2 text-xs text-yellow-400">
              Awaiting review
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2c35] bg-[#181920] p-5">
            <p className="text-sm font-medium text-gray-400">
              Approved
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {approvedCount}
            </p>

            <p className="mt-2 text-xs text-green-400">
              Ready for payment
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2c35] bg-[#181920] p-5">
            <p className="text-sm font-medium text-gray-400">
              Rejected
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {rejectedCount}
            </p>

            <p className="mt-2 text-xs text-red-400">
              Requests rejected
            </p>
          </div>
        </div>

        {/* Search and filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search by user or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#2b2c35] bg-[#181920] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#2b2c35] bg-[#181920] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="all">All withdrawals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Withdrawals table */}
        <div className="overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920]">
          <div className="border-b border-[#2b2c35] px-6 py-5">
            <h2 className="font-semibold text-white">
              Withdrawal Requests ({filteredWithdrawals.length})
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Review withdrawal requests submitted by users.
            </p>
          </div>

          <div className="admin-table-scroll overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                  <th className="px-6 py-4 font-medium">
                    User
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Amount
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Method
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Date
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
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Loading withdrawals...
                      </div>
                    </td>
                  </tr>
                ) : filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((withdrawal) => (
                    <tr
                      key={withdrawal.id}
                      className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {withdrawal.user.name || "Unnamed User"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {withdrawal.user.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-200">
                        {formatAmount(
                          withdrawal.amount,
                          withdrawal.currency
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-400">
                        Bank Transfer
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            withdrawal.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : withdrawal.status === "APPROVED"
                                ? "bg-green-500/10 text-green-400"
                                : withdrawal.status === "PAID"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {getStatusLabel(withdrawal.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(withdrawal.createdAt)}
                      </td>

                      <td className="relative px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === withdrawal.id
                                ? null
                                : withdrawal.id
                            )
                          }
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-400"
                          aria-label={`Actions for ${
                            withdrawal.user.name || "user"
                          }`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenu === withdrawal.id && (
                          <div className="absolute right-6 top-14 z-20 w-52 overflow-hidden rounded-xl border border-[#2b2c35] bg-[#181920] py-1 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setSelectedWithdrawal(withdrawal);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <Eye size={17} />
                              View Withdrawal
                            </button>

                            {withdrawal.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading === withdrawal.id
                                  }
                                  onClick={() =>
                                    handleApprove(withdrawal)
                                  }
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-green-400 transition hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {actionLoading === withdrawal.id ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check size={17} />
                                  )}
                                  Approve Withdrawal
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    actionLoading === withdrawal.id
                                  }
                                  onClick={() =>
                                    openRejectModal(withdrawal)
                                  }
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <X size={17} />
                                  Reject Withdrawal
                                </button>
                              </>
                            )}

                            {withdrawal.status === "APPROVED" && (
                              <button
                                type="button"
                                disabled={
                                  actionLoading === withdrawal.id
                                }
                                onClick={() =>
                                  handleMarkPaid(withdrawal)
                                }
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-blue-400 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionLoading === withdrawal.id ? (
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={17} />
                                )}
                                Mark as Paid
                              </button>
                            )}
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
                      No withdrawals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Withdrawal Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Withdrawal Details
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Review the withdrawal request and account details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {/* User */}
              <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedWithdrawal.user.name ||
                        "Unnamed User"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      {selectedWithdrawal.user.email}
                    </p>

                    {selectedWithdrawal.user.phone && (
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedWithdrawal.user.phone}
                      </p>
                    )}
                  </div>

                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                      selectedWithdrawal.status === "PENDING"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : selectedWithdrawal.status === "APPROVED"
                          ? "bg-green-500/10 text-green-400"
                          : selectedWithdrawal.status === "PAID"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {getStatusLabel(selectedWithdrawal.status)}
                  </span>
                </div>
              </div>

              {/* Withdrawal information */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Withdrawal Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Amount
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatAmount(
                        selectedWithdrawal.amount,
                        selectedWithdrawal.currency
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Payment Method
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      Bank Transfer
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Request Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {formatDate(selectedWithdrawal.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Request ID
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      WD-
                      {String(selectedWithdrawal.id).padStart(
                        5,
                        "0"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank details */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Withdrawal Account
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Account Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {selectedWithdrawal.accountName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Bank
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {selectedWithdrawal.bankName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4 sm:col-span-2">
                    <p className="text-xs text-gray-500">
                      Account Number
                    </p>

                    <p className="mt-1 text-sm font-medium tracking-wide text-gray-200">
                      {selectedWithdrawal.accountNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection reason */}
              {selectedWithdrawal.rejectionReason && (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-medium text-red-400">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {selectedWithdrawal.rejectionReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedWithdrawal.status === "PENDING" && (
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawal(null)}
                    className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading === selectedWithdrawal.id
                    }
                    onClick={() =>
                      openRejectModal(selectedWithdrawal)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={17} />
                    Reject Withdrawal
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading === selectedWithdrawal.id
                    }
                    onClick={() =>
                      handleApprove(selectedWithdrawal)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === selectedWithdrawal.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={17} />
                    )}
                    Approve Withdrawal
                  </button>
                </div>
              )}

              {selectedWithdrawal.status === "APPROVED" && (
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawal(null)}
                    className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading === selectedWithdrawal.id
                    }
                    onClick={() =>
                      handleMarkPaid(selectedWithdrawal)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === selectedWithdrawal.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={17} />
                    )}
                    Mark as Paid
                  </button>
                </div>
              )}

              {(selectedWithdrawal.status === "REJECTED" ||
                selectedWithdrawal.status === "PAID") && (
                <div className="mt-6 flex justify-end border-t border-[#2b2c35] pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawal(null)}
                    className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {showRejectModal && withdrawalToReject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#2b2c35] bg-[#181920] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Reject Withdrawal
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Provide a reason for rejecting this withdrawal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setWithdrawalToReject(null);
                  setRejectionReason("");
                }}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-300">
                Rejection reason
              </label>

              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(e.target.value)
                }
                placeholder="e.g. Bank account details could not be verified."
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setWithdrawalToReject(null);
                  setRejectionReason("");
                }}
                className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !rejectionReason.trim() ||
                  actionLoading === withdrawalToReject.id
                }
                onClick={handleReject}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === withdrawalToReject.id ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <X size={17} />
                )}
                Reject Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}