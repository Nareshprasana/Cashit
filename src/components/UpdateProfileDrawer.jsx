import { useState } from "react";
import { X } from "lucide-react";

export function UpdateProfileDrawer({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form); // Your API or mutation
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 h-full max-w-md w-full bg-white shadow-xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="border rounded px-3 py-2 w-full"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="border rounded px-3 py-2 w-full"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Avatar URL</label>
            <input
              className="border rounded px-3 py-2 w-full"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
            />
          </div>
          {/* Add more fields as needed */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
