"use client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import * as React from "react";
import { Link } from "react-router-dom";
import { SupportSection } from "./SupportSection";

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState("profile");
  const [profileType, setProfileType] = React.useState("general");
  const [email, setEmail] = React.useState("user@example.com");
  const [isEditing, setIsEditing] = React.useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);
  const [notificationPreferences, setNotificationPreferences] = React.useState({
    newsUpdates: true,
    withdrawals: true,
    deposits: true,
  });
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const profileTypes = [
    { id: "general", label: "General User", desc: "Everyday management" },
    { id: "trader", label: "Trader", desc: "Active trading" },
    { id: "institutional", label: "Institutional", desc: "Enterprise grade" },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-[#F0E7A1]" : "bg-white/10"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white/3 border border-white/10 rounded-xl p-6">{children}</div>
  );

  const settingsSections = [
    {
      id: "profile",
      title: "Profile",
      content: (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-3xl text-white/20">
                  {profilePicture
                    ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    : <span>?</span>
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#F0E7A1] text-black p-1.5 rounded-full hover:bg-[#F0E7A1]/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProfilePicture(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Profile picture</p>
                <p className="text-xs text-white/40 mt-0.5">Click the pencil to upload a new photo</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Account type</h3>
            <div className="grid grid-cols-3 gap-3">
              {profileTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setProfileType(t.id)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    profileType === t.id
                      ? "border-[#F0E7A1]/50 bg-[#F0E7A1]/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className={`text-sm font-semibold ${profileType === t.id ? "text-[#F0E7A1]" : "text-white/70"}`}>{t.label}</div>
                  <div className="text-xs text-white/30 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Contact</h3>
            <div className="space-y-3">
              <label className="block text-sm text-white/50">Email address</label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F0E7A1]/40 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={() => setIsEditing((e) => !e)}
                  className="px-4 py-2.5 border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 hover:text-white transition-colors"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>
              {isEditing && (
                <button className="px-5 py-2 bg-[#F0E7A1] text-black text-sm font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors">
                  Save changes
                </button>
              )}
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "security",
      title: "Security & Privacy",
      content: (
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-xs text-white/40 mt-1">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  is2FAEnabled
                    ? "bg-[#F0E7A1] text-black"
                    : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {is2FAEnabled ? "Enabled" : "Enable"}
              </button>
            </div>
            {is2FAEnabled && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0E7A1]/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F0E7A1]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email verification</p>
                    <p className="text-xs text-white/40">Receive a verification code via email</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Notifications",
      content: (
        <div className="space-y-4">
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white">News & Updates</h3>
                <p className="text-xs text-white/40 mt-1">Better Wallet updates and market news</p>
              </div>
              <Toggle
                value={notificationPreferences.newsUpdates}
                onChange={() => setNotificationPreferences((p) => ({ ...p, newsUpdates: !p.newsUpdates }))}
              />
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white">Transaction alerts</h3>
                <p className="text-xs text-white/40 mt-1">Deposits, withdrawals, and swaps</p>
              </div>
              <Toggle
                value={notificationPreferences.withdrawals}
                onChange={() =>
                  setNotificationPreferences((p) => ({
                    ...p,
                    withdrawals: !p.withdrawals,
                    deposits: !p.deposits,
                  }))
                }
              />
            </div>
            {notificationPreferences.withdrawals && (
              <p className="mt-4 pt-4 border-t border-white/10 text-xs text-white/30">
                Alerts will be sent to {email}
              </p>
            )}
          </Card>
        </div>
      ),
    },
    {
      id: "support",
      title: "Support",
      content: <SupportSection />,
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <header className="bg-black border-b border-[#F0E7A1]/10">
        <div className="px-6 py-4 flex justify-between items-center">
          <Link to="/Portfolio">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-black border-r border-[#F0E7A1]/10 p-4">
          <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider px-3 mb-3">Settings</h2>
          <nav>
            <ul className="space-y-1">
              {settingsSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-[#F0E7A1]/15 text-[#F0E7A1]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">
              {settingsSections.find((s) => s.id === activeSection)?.title}
            </h2>
            {settingsSections.find((s) => s.id === activeSection)?.content}
          </div>
        </main>
      </div>
    </div>
  );
};
