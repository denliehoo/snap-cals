import { useCreateAdmin } from "./use-create-admin";

export function CreateAdminPage() {
  const {
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  } = useCreateAdmin();

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-bold text-gray-100 mb-4">Create Admin</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-lg shadow p-6 space-y-4 border border-gray-800"
      >
        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="admin-email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label
            htmlFor="admin-name"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Name
          </label>
          <input
            id="admin-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label
            htmlFor="admin-password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-2 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Admin"}
        </button>
      </form>
    </div>
  );
}
