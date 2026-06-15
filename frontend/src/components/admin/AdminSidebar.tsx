"use client";
import React from "react";
import { useNavigate } from "react-router-dom";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-neutral-900 text-white p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <button
        onClick={() => navigate("/AdminDashboard")}
        className="block w-full text-left px-4 py-2 rounded hover:bg-neutral-700"
      >
        Support Threads
      </button>
    </div>
  );
};

export default AdminSidebar;
