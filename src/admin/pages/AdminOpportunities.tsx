import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Trash2,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../config";

type TaskType = "TASK" | "SOCIAL" | "APP" | "OTHER";
type TaskStatus = "ACTIVE" | "PAUSED";

interface AdminTask {
  id: number;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  payout: number | null;
  currency: string;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  clicks: number;
  applications: number;
  earnings: number;
  earningsCurrency: string;
}

interface TaskForm {
  title: string;
  description: string;
  type: TaskType;
  payout: string;
  externalUrl: string;
}



const getToken = () => localStorage.getItem("token");

const formatCurrency = (
  amount: number | null,
  currency = "NGN",
) => {
  if (amount === null || amount === undefined) {
    return "—";
  }

  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  type: "TASK",
  payout: "",
  externalUrl: "",
};

export default function AdminOpportunities() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] =
    useState<AdminTask | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState<TaskForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  // ----------------------------------------
  // Fetch tasks
  // ----------------------------------------

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch tasks",
        );
      }

      setTasks(data.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tasks",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ----------------------------------------
  // Filtering
  // ----------------------------------------

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        task.type.toLowerCase() === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        task.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [tasks, search, typeFilter, statusFilter]);

  // ----------------------------------------
  // Create task
  // ----------------------------------------

  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Task description is required.");
      return;
    }

    if (!form.payout.trim()) {
      setError("Task reward is required.");
      return;
    }

    const payout = Number(form.payout);

    if (Number.isNaN(payout) || payout < 0) {
      setError("Reward must be a valid number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          payout,
          currency: "NGN",
          externalUrl:
            form.externalUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create task",
        );
      }

      setShowCreateModal(false);
      setForm(emptyForm);

      await fetchTasks();
    } catch (err) {
      console.error("Failed to create task:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create task",
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // Edit task
  // ----------------------------------------

  const openEditModal = (task: AdminTask) => {
    setSelectedTask(task);

    setForm({
      title: task.title,
      description: task.description,
      type: task.type,
      payout:
        task.payout !== null
          ? String(task.payout)
          : "",
      externalUrl: task.externalUrl || "",
    });

    setOpenMenu(null);
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Task description is required.");
      return;
    }

    if (!form.payout.trim()) {
      setError("Task reward is required.");
      return;
    }

    const payout = Number(form.payout);

    if (Number.isNaN(payout) || payout < 0) {
      setError("Reward must be a valid number.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${selectedTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            type: form.type,
            payout,
            currency: "NGN",
            externalUrl:
              form.externalUrl.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update task",
        );
      }

      setShowEditModal(false);
      setSelectedTask(null);
      setForm(emptyForm);

      await fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task",
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // Pause / Activate
  // ----------------------------------------

  const handleStatusChange = async (
    task: AdminTask,
  ) => {
    try {
      setActionLoading(task.id);
      setOpenMenu(null);
      setError("");

      const newStatus =
        task.status === "ACTIVE"
          ? "PAUSED"
          : "ACTIVE";

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${task.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update task status",
        );
      }

      await fetchTasks();
    } catch (err) {
      console.error(
        "Failed to update task status:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ----------------------------------------
  // Delete task
  // ----------------------------------------

  const handleDeleteTask = async (
    task: AdminTask,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!confirmed) {
      setOpenMenu(null);
      return;
    }

    try {
      setActionLoading(task.id);
      setOpenMenu(null);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${task.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete task",
        );
      }

      if (selectedTask?.id === task.id) {
        setSelectedTask(null);
      }

      await fetchTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete task",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ----------------------------------------
  // Reset create modal
  // ----------------------------------------

  const openCreateModal = () => {
    setForm(emptyForm);
    setError("");
    setShowCreateModal(true);
  };

  return (
    <>
      {/* Main page */}
      <div>
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Tasks
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Create and manage tasks available to
              Advest users.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Create Task
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Search and filters */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-[#2b2c35] bg-[#181920] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
            className="rounded-xl border border-[#2b2c35] bg-[#181920] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="all">All types</option>
            <option value="task">Task</option>
            <option value="social">Social</option>
            <option value="app">App</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-[#2b2c35] bg-[#181920] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Task table */}
        <div className="overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920]">
          <div className="border-b border-[#2b2c35] px-6 py-5">
            <h2 className="font-semibold text-white">
              All Tasks ({filteredTasks.length})
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Manage the tasks displayed to users.
            </p>
          </div>

          <div className="admin-table-scroll overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-[#2b2c35] text-xs uppercase text-gray-500">
                  <th className="px-6 py-4 font-medium">
                    Task
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Type
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Reward
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Clicks
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
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
                      Loading tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-[#24252d] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {task.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Created{" "}
                            {formatDate(
                              task.createdAt,
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          {task.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-200">
                        {formatCurrency(
                          task.payout,
                          task.currency,
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-400">
                        {task.clicks.toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            task.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {task.status === "ACTIVE"
                            ? "Active"
                            : "Paused"}
                        </span>
                      </td>

                      <td className="relative px-6 py-4">
                        <button
                          type="button"
                          disabled={
                            actionLoading === task.id
                          }
                          onClick={() =>
                            setOpenMenu(
                              openMenu === task.id
                                ? null
                                : task.id,
                            )
                          }
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50"
                          aria-label={`Actions for ${task.title}`}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenu === task.id && (
                          <div className="absolute right-6 top-14 z-20 w-48 overflow-hidden rounded-xl border border-[#2b2c35] bg-[#181920] py-1 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setSelectedTask(task);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <Eye size={17} />
                              View Task
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(task)
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              <Pencil size={17} />
                              Edit Task
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(task)
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400"
                            >
                              {task.status ===
                              "ACTIVE" ? (
                                <Pause size={17} />
                              ) : (
                                <Play size={17} />
                              )}

                              {task.status === "ACTIVE"
                                ? "Pause Task"
                                : "Activate Task"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteTask(task)
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={17} />
                              Delete Task
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
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Task Modal */}
      {selectedTask && !showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Task Details
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  View performance and configuration
                  details.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTask(null)
                }
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {/* Task header */}
              <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedTask.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Created{" "}
                      {formatDate(
                        selectedTask.createdAt,
                      )}
                    </p>
                  </div>

                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                      selectedTask.status ===
                      "ACTIVE"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {selectedTask.status === "ACTIVE"
                      ? "Active"
                      : "Paused"}
                  </span>
                </div>
              </div>

              {/* Task information */}
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Task Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Type
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {selectedTask.type}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Reward
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-200">
                      {formatCurrency(
                        selectedTask.payout,
                        selectedTask.currency,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                  <p className="text-xs text-gray-500">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-300">
                    {selectedTask.description}
                  </p>
                </div>

                {selectedTask.externalUrl && (
                  <div className="mt-3 rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      External URL
                    </p>

                    <a
                      href={selectedTask.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-sm text-blue-400 hover:text-blue-300"
                    >
                      {selectedTask.externalUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Performance */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Performance
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Clicks
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {selectedTask.clicks.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Applications
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {selectedTask.applications.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#2b2c35] bg-[#0f1015] p-4">
                    <p className="text-xs text-gray-500">
                      Earnings
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatCurrency(
                        selectedTask.earnings,
                        selectedTask.earningsCurrency,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTask(null)
                  }
                  className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openEditModal(selectedTask)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  <Pencil size={16} />
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create Task
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Add a new task for Advest users.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              <div className="grid gap-5">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Task Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Complete a Survey"
                    className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Type and reward */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Type
                    </label>

                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value as TaskType,
                        })
                      }
                      className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
                    >
                      <option value="TASK">
                        Task
                      </option>
                      <option value="SOCIAL">
                        Social
                      </option>
                      <option value="APP">
                        App
                      </option>
                      <option value="OTHER">
                        Other
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Reward (₦)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.payout}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          payout: e.target.value,
                        })
                      }
                      placeholder="e.g. 2500"
                      className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Task URL
                  </label>

                  <input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        externalUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/task"
                    className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe what users need to do..."
                    className="w-full resize-none rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Modal actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateModal(false)
                    }
                    className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCreateTask}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Creating..."
                      : "Create Task"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2b2c35] bg-[#181920] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2b2c35] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Task
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Update this task's information.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditModal(false)
                }
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              <div className="grid gap-5">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Task Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Type and reward */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Type
                    </label>

                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value as TaskType,
                        })
                      }
                      className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
                    >
                      <option value="TASK">
                        Task
                      </option>
                      <option value="SOCIAL">
                        Social
                      </option>
                      <option value="APP">
                        App
                      </option>
                      <option value="OTHER">
                        Other
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Reward (₦)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.payout}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          payout: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Task URL
                  </label>

                  <input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        externalUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/task"
                    className="w-full rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-xl border border-[#2b2c35] bg-[#0f1015] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>

                {/* Modal actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-[#2b2c35] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setShowEditModal(false)
                    }
                    className="rounded-xl border border-[#2b2c35] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleUpdateTask}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}