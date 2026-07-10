"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    weight: "",
    cycleLength: "28",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate sign up registration & save to sessionStorage
    setTimeout(() => {
      sessionStorage.setItem("user", JSON.stringify(formData));
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#050505] px-4 py-16 overflow-hidden">
      {/* Background glowing ambient mesh orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Double-Bezel Card Outer Shell */}
        <div className="rounded-[2.5rem] bg-white/[0.02] p-2 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">
          
          {/* Inner Core */}
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#0c0c0e] p-8 md:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">SAKHI</span>
              </h1>
              <p className="text-sm text-zinc-400">
                Your personalized AI health and wellness companion
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="60"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Cycle Avg (days)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="28"
                    value={formData.cycleLength}
                    onChange={(e) => setFormData({ ...formData, cycleLength: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group flex items-center justify-between pl-6 pr-3 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{loading ? "Creating Account..." : "Create Account"}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    ➔
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
