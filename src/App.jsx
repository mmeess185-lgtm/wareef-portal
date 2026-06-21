import React, { useState, useMemo, useRef } from "react";
import {
  Wrench, Home, Bell, MessageSquare, User, Plus, Filter, CheckCircle2,
  Clock, AlertTriangle, Settings, LogOut, Sun, Moon, Globe, Camera,
  MapPin, Star, FileText, Download, BarChart3, Users, Building2, Wind,
  Zap, Droplet, Hammer, Sparkles, MoreHorizontal, ChevronRight, X, Send,
  ChevronLeft, QrCode, ThumbsUp, PauseCircle, PlayCircle, XCircle,
  ClipboardList, TrendingUp, Search, ArrowLeft, Menu, Package
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  getTenantContext, fetchTechnicians,
  fetchAllRequests, fetchRequestsForUnit, fetchRequestsForTechnician,
  fetchRequestDetail, createRequest, updateRequestStatus, assignTechnician,
  addNote, sendChatMessage, submitRating,
} from "./lib/api";
import { sendMagicLink, getSession, onAuthStateChange, signOut, fetchMyProfile } from "./lib/auth";

/* ============================== CONSTANTS ============================== */

const CATEGORIES = [
  { id: "ac", en: "Air Conditioning", ar: "تكييف", icon: Wind, color: "#0EA5E9" },
  { id: "electrical", en: "Electrical", ar: "كهرباء", icon: Zap, color: "#F59E0B" },
  { id: "plumbing", en: "Plumbing", ar: "سباكة", icon: Droplet, color: "#3B82F6" },
  { id: "civil", en: "Civil Works", ar: "أعمال مدنية", icon: Hammer, color: "#78716C" },
  { id: "appliances", en: "Appliances", ar: "أجهزة", icon: Settings, color: "#8B5CF6" },
  { id: "cleaning", en: "Cleaning", ar: "تنظيف", icon: Sparkles, color: "#10B981" },
  { id: "other", en: "Other", ar: "أخرى", icon: MoreHorizontal, color: "#64748B" },
];

const PRIORITIES = [
  { id: "emergency", en: "Emergency", ar: "طارئ", color: "#EF4444", bg: "#FEF2F2" },
  { id: "high", en: "High", ar: "عالي", color: "#F97316", bg: "#FFF7ED" },
  { id: "normal", en: "Normal", ar: "عادي", color: "#2563EB", bg: "#EFF6FF" },
  { id: "low", en: "Low", ar: "منخفض", color: "#64748B", bg: "#F8FAFC" },
];

const STATUSES = [
  { id: "new", en: "New", ar: "جديد", color: "#2563EB", bg: "#EFF6FF" },
  { id: "assigned", en: "Assigned", ar: "تم الإسناد", color: "#7C3AED", bg: "#F5F3FF" },
  { id: "in_progress", en: "In Progress", ar: "قيد التنفيذ", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "waiting_parts", en: "Waiting for Parts", ar: "بانتظار القطع", color: "#F97316", bg: "#FFF7ED" },
  { id: "completed", en: "Completed", ar: "مكتمل", color: "#10B981", bg: "#ECFDF5" },
  { id: "closed", en: "Closed", ar: "مغلق", color: "#64748B", bg: "#F8FAFC" },
];

const BUILDINGS = ["Building A", "Building B", "Building C", "Building D"];

let TECHNICIANS = [
  { id: "t1", name: "Karim Saeed", specialty: "ac", phone: "+971 50 111 2222", active: 3, rating: 4.8 },
  { id: "t2", name: "Imran Khan", specialty: "electrical", phone: "+971 50 333 4444", active: 2, rating: 4.6 },
  { id: "t3", name: "Yusuf Al-Hadi", specialty: "plumbing", phone: "+971 50 555 6666", active: 4, rating: 4.9 },
  { id: "t4", name: "Daniel Cruz", specialty: "civil", phone: "+971 50 777 8888", active: 1, rating: 4.7 },
];

let CURRENT_TENANT = {
  name: "Ahmed Al-Farsi",
  unit: "204",
  building: "Building A",
  phone: "+971 55 123 4567",
  email: "ahmed.farsi@email.com",
  moveIn: "2023-02-10",
};

const today = new Date();
const daysAgo = (n, h = 9) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const initialRequests = [
  {
    id: "REQ-1042", unit: "204", building: "Building A", tenant: "Ahmed Al-Farsi",
    category: "ac", priority: "emergency", status: "in_progress",
    description: "AC unit in master bedroom stopped cooling completely, leaking water onto the floor.",
    createdAt: daysAgo(0, 8), preferredTime: "Anytime today",
    technician: "t1", notes: [{ by: "Coordinator", text: "Assigned to Karim, urgent leak risk.", at: daysAgo(0, 9) }],
    chat: [
      { from: "tenant", text: "It's leaking quite a lot now, please hurry.", at: daysAgo(0, 8) },
      { from: "coordinator", text: "Technician Karim is on the way, ETA 30 mins.", at: daysAgo(0, 9) },
    ],
    photos: 2, rating: null,
  },
  {
    id: "REQ-1041", unit: "204", building: "Building A", tenant: "Ahmed Al-Farsi",
    category: "plumbing", priority: "high", status: "waiting_parts",
    description: "Kitchen sink mixer tap is broken, water won't shut off properly.",
    createdAt: daysAgo(2, 14), preferredTime: "Tomorrow morning",
    technician: "t3", notes: [{ by: "Yusuf Al-Hadi", text: "Need replacement cartridge, ordered from supplier.", at: daysAgo(1, 11) }],
    chat: [{ from: "coordinator", text: "Part has been ordered, expected in 2 days.", at: daysAgo(1, 11) }],
    photos: 1, rating: null,
  },
  {
    id: "REQ-1038", unit: "118", building: "Building B", tenant: "Sara Mansour",
    category: "electrical", priority: "normal", status: "completed",
    description: "Living room ceiling light flickers and sometimes won't turn on.",
    createdAt: daysAgo(5, 10), preferredTime: "Weekday evening",
    technician: "t2", notes: [{ by: "Imran Khan", text: "Replaced faulty ballast and rewired connection.", at: daysAgo(4, 16) }],
    chat: [], photos: 4, rating: 5,
  },
  {
    id: "REQ-1035", unit: "302", building: "Building C", tenant: "Liu Wei",
    category: "civil", priority: "low", status: "closed",
    description: "Small crack in bathroom tile near the shower drain.",
    createdAt: daysAgo(9, 9), preferredTime: "Flexible",
    technician: "t4", notes: [{ by: "Daniel Cruz", text: "Re-grouted and sealed.", at: daysAgo(7, 13) }],
    chat: [], photos: 3, rating: 4,
  },
  {
    id: "REQ-1029", unit: "405", building: "Building A", tenant: "Fatima Noor",
    category: "appliances", priority: "normal", status: "new",
    description: "Dishwasher does not drain water after the wash cycle ends.",
    createdAt: daysAgo(0, 7), preferredTime: "This afternoon",
    technician: null, notes: [], chat: [], photos: 1, rating: null,
  },
  {
    id: "REQ-1027", unit: "210", building: "Building B", tenant: "Omar Saleh",
    category: "cleaning", priority: "low", status: "new",
    description: "Need deep cleaning of AC vents and filters, dust buildup is visible.",
    createdAt: daysAgo(1, 12), preferredTime: "Weekend",
    technician: null, notes: [], chat: [], photos: 0, rating: null,
  },
  {
    id: "REQ-1024", unit: "501", building: "Building D", tenant: "Nadia Hussein",
    category: "ac", priority: "high", status: "assigned",
    description: "AC making a loud rattling noise especially at night.",
    createdAt: daysAgo(1, 18), preferredTime: "Tonight",
    technician: "t1", notes: [], chat: [], photos: 1, rating: null,
  },
  {
    id: "REQ-1019", unit: "118", building: "Building B", tenant: "Sara Mansour",
    category: "plumbing", priority: "emergency", status: "closed",
    description: "Burst pipe under the kitchen sink flooding the floor.",
    createdAt: daysAgo(14, 6), preferredTime: "Immediate",
    technician: "t3", notes: [{ by: "Yusuf Al-Hadi", text: "Replaced pipe section, tested for 24h, no leaks.", at: daysAgo(13, 10) }],
    chat: [], photos: 5, rating: 5,
  },
  {
    id: "REQ-1015", unit: "204", building: "Building A", tenant: "Ahmed Al-Farsi",
    category: "electrical", priority: "normal", status: "closed",
    description: "Power socket in home office not working.",
    createdAt: daysAgo(20, 9), preferredTime: "Anytime",
    technician: "t2", notes: [], chat: [], photos: 1, rating: 4,
  },
  {
    id: "REQ-1011", unit: "302", building: "Building C", tenant: "Liu Wei",
    category: "civil", priority: "normal", status: "completed",
    description: "Front door hinge squeaks loudly and door doesn't close fully.",
    createdAt: daysAgo(3, 15), preferredTime: "Weekday",
    technician: "t4", notes: [], chat: [], photos: 2, rating: null,
  },
  {
    id: "REQ-1008", unit: "405", building: "Building A", tenant: "Fatima Noor",
    category: "other", priority: "low", status: "new",
    description: "Mailbox key is stuck and won't turn.",
    createdAt: daysAgo(0, 16), preferredTime: "Anytime",
    technician: null, notes: [], chat: [], photos: 0, rating: null,
  },
];

const T = {
  en: {
    appName: "Wareef Maintenance Portal", dashboard: "Dashboard", requests: "Requests",
    newRequest: "New Request", profile: "Profile", technicians: "Technicians",
    reports: "Reports", myJobs: "My Jobs", logout: "Log out", switchRole: "Demo: switch role",
    tenant: "Tenant", coordinator: "Coordinator", technician: "Technician",
    totalRequests: "Total Requests", openRequests: "Open Requests", completedRequests: "Completed",
    emergencyRequests: "Emergency", avgCompletion: "Avg. Completion Time",
    submitRequest: "Submit a Maintenance Request", category: "Category", priority: "Priority",
    description: "Description", preferredTime: "Preferred Visit Time", uploadPhotos: "Upload Photos / Videos",
    submit: "Submit Request", myRequests: "My Requests", history: "Request History",
    requestDetail: "Request Details", chatWith: "Chat with Coordinator", status: "Status",
    filterBy: "Filters", all: "All", assignTechnician: "Assign Technician", addNote: "Add Note",
    internalNotes: "Internal Notes & Comments", changeStatus: "Update Status", rate: "Rate this service",
    apartmentInfo: "Apartment Information", export: "Export", exportPDF: "Export PDF", exportExcel: "Export Excel",
    acceptJob: "Accept", rejectJob: "Reject", markComplete: "Mark Completed", materialsUsed: "Materials Used",
    beforeAfter: "Before / After Photos", monthlyReport: "Monthly Trend", byCategory: "By Category",
    byStatus: "By Status", search: "Search requests...",
  },
  ar: {
    appName: "بوابة وريف للصيانة", dashboard: "لوحة التحكم", requests: "الطلبات",
    newRequest: "طلب جديد", profile: "الملف الشخصي", technicians: "الفنيون",
    reports: "التقارير", myJobs: "مهامي", logout: "تسجيل الخروج", switchRole: "تجربة: تبديل الدور",
    tenant: "مستأجر", coordinator: "منسق", technician: "فني",
    totalRequests: "إجمالي الطلبات", openRequests: "طلبات مفتوحة", completedRequests: "مكتملة",
    emergencyRequests: "طارئة", avgCompletion: "متوسط وقت الإنجاز",
    submitRequest: "إرسال طلب صيانة", category: "الفئة", priority: "الأولوية",
    description: "الوصف", preferredTime: "وقت الزيارة المفضل", uploadPhotos: "رفع صور / فيديو",
    submit: "إرسال الطلب", myRequests: "طلباتي", history: "سجل الطلبات",
    requestDetail: "تفاصيل الطلب", chatWith: "محادثة مع المنسق", status: "الحالة",
    filterBy: "تصفية", all: "الكل", assignTechnician: "إسناد فني", addNote: "إضافة ملاحظة",
    internalNotes: "ملاحظات داخلية", changeStatus: "تحديث الحالة", rate: "قيّم الخدمة",
    apartmentInfo: "معلومات الشقة", export: "تصدير", exportPDF: "تصدير PDF", exportExcel: "تصدير Excel",
    acceptJob: "قبول", rejectJob: "رفض", markComplete: "إنهاء المهمة", materialsUsed: "المواد المستخدمة",
    beforeAfter: "صور قبل / بعد", monthlyReport: "الاتجاه الشهري", byCategory: "حسب الفئة",
    byStatus: "حسب الحالة", search: "بحث في الطلبات...",
  },
};

/* ============================== HELPERS ============================== */

const catInfo = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[6];
const prioInfo = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[2];
const statusInfo = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
const techInfo = (id) => TECHNICIANS.find((t) => t.id === id);
const fmtDate = (iso, lang) =>
  new Date(iso).toLocaleString(lang === "ar" ? "ar-AE" : "en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* ============================== SMALL UI ATOMS ============================== */

function Pill({ color, bg, children }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function CategoryIcon({ id, size = 16 }) {
  const c = catInfo(id);
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg shrink-0"
      style={{ backgroundColor: c.color + "1A", color: c.color, width: size + 16, height: size + 16 }}
    >
      <Icon size={size} />
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20",
    secondary: "bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <Card className="p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <span
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ backgroundColor: accent + "1A", color: accent }}
      >
        <Icon size={20} />
      </span>
    </Card>
  );
}

/* The lifecycle stepper — signature visual element used across request views */
const PIPELINE = ["new", "assigned", "in_progress", "waiting_parts", "completed", "closed"];

function StatusPipeline({ status, lang }) {
  const idx = PIPELINE.indexOf(status);
  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {PIPELINE.map((s, i) => {
        const info = statusInfo(s);
        const reached = i <= idx;
        const isLast = i === PIPELINE.length - 1;
        return (
          <div key={s} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 64 }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
                style={{
                  backgroundColor: reached ? info.color : "transparent",
                  borderColor: reached ? info.color : "#CBD5E1",
                  color: reached ? "#fff" : "#94A3B8",
                }}
              >
                {reached ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{ color: reached ? info.color : "#94A3B8" }}
              >
                {info[lang]}
              </span>
            </div>
            {!isLast && (
              <div className="h-0.5 w-8 sm:w-10 mb-4" style={{ backgroundColor: i < idx ? statusInfo(PIPELINE[i + 1]).color : "#E2E8F0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {sub && <p className="text-sm text-slate-400 mt-1 max-w-xs">{sub}</p>}
    </div>
  );
}

/* ============================== LAYOUT ============================== */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm shadow-blue-600/30">
        <Wrench size={18} className="text-white" />
      </div>
      <div className="leading-tight">
        <p className="font-bold text-slate-900 dark:text-white text-sm">Wareef</p>
        <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide uppercase">Maintenance</p>
      </div>
    </div>
  );
}

function NAV_ITEMS(role, t) {
  if (role === "tenant")
    return [
      { id: "dashboard", label: t.dashboard, icon: Home },
      { id: "new", label: t.newRequest, icon: Plus },
      { id: "requests", label: t.myRequests, icon: ClipboardList },
      { id: "profile", label: t.profile, icon: User },
    ];
  if (role === "coordinator")
    return [
      { id: "dashboard", label: t.dashboard, icon: Home },
      { id: "requests", label: t.requests, icon: ClipboardList },
      { id: "technicians", label: t.technicians, icon: Users },
      { id: "reports", label: t.reports, icon: FileText },
    ];
  return [
    { id: "dashboard", label: t.myJobs, icon: Home },
    { id: "requests", label: t.requests, icon: ClipboardList },
    { id: "profile", label: t.profile, icon: User },
  ];
}

function Sidebar({ role, t, view, setView, mobileOpen, setMobileOpen, lang, onLogout }) {
  const items = NAV_ITEMS(role, t);
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed lg:sticky top-0 ${lang === "ar" ? "right-0" : "left-0"} h-screen w-64 bg-white dark:bg-slate-900 border-${lang === "ar" ? "l" : "r"} border-slate-200 dark:border-slate-800 z-40 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : lang === "ar" ? "translate-x-full" : "-translate-x-full"
        } lg:flex`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => { setView(it.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                {it.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut size={18} />
            {t.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ t, lang, setLang, dark, setDark, role, displayName, initials, setMobileOpen, title, notifCount }) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <h1 className="font-bold text-slate-900 dark:text-white truncate text-base sm:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {t[role]}
        </span>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300" title="Language">
          <Globe size={18} />
        </button>
        <button onClick={() => setDark((d) => !d)} className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300" title="Theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="relative p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300">
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center text-xs font-bold ml-1" title={displayName}>
          {initials}
        </div>
      </div>
    </header>
  );
}

/* ============================== REQUEST CARD ============================== */

function RequestCard({ req, lang, t, onOpen, showTenant }) {
  const cat = catInfo(req.category);
  const prio = prioInfo(req.priority);
  const st = statusInfo(req.status);
  const tech = techInfo(req.technician);
  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer" >
      <div onClick={() => onOpen(req)}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <CategoryIcon id={req.category} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{cat[lang]}</p>
              <p className="text-xs text-slate-400">
                {req.id} · {showTenant ? `${req.tenant} · ` : ""}{req.building}, Unit {req.unit}
              </p>
            </div>
          </div>
          {req.priority === "emergency" && <AlertTriangle size={18} className="text-red-500 shrink-0" />}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{req.description}</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Pill color={st.color} bg={st.bg}>{st[lang]}</Pill>
          <Pill color={prio.color} bg={prio.bg}>{prio[lang]}</Pill>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span>{fmtDate(req.createdAt, lang)}</span>
          <span className="flex items-center gap-1">
            {tech ? tech.name : <span className="italic">Unassigned</span>}
            <ChevronRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
          </span>
        </div>
      </div>
    </Card>
  );
}

function FilterBar({ t, filters, setFilters, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ key, label, values }) => (
        <select
          key={key}
          value={filters[key]}
          onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
          className="text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{label}: {t.all}</option>
          {values.map((v) => (
            <option key={v.id || v} value={v.id || v}>
              {v.en ? v.en : v}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

/* ============================== REQUEST DETAIL ============================== */

function RequestDetail({ req, lang, t, role, onBack, onUpdate }) {
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [materials, setMaterials] = useState("");
  const cat = catInfo(req.category);
  const prio = prioInfo(req.priority);
  const st = statusInfo(req.status);
  const tech = techInfo(req.technician);

  const sendChat = () => {
    if (!msg.trim()) return;
    const from = role === "tenant" ? "tenant" : "coordinator";
    onUpdate(req.id, { chat: [...req.chat, { from, text: msg.trim(), at: new Date().toISOString() }] });
    setMsg("");
  };

  const addNote = () => {
    if (!note.trim()) return;
    const by = role === "technician" ? (tech ? tech.name : "Technician") : "Coordinator";
    onUpdate(req.id, { notes: [...req.notes, { by, text: note.trim(), at: new Date().toISOString() }] });
    setNote("");
  };

  const setStatus = (s) => onUpdate(req.id, { status: s });
  const assignTech = (techId) => onUpdate(req.id, { technician: techId, status: req.status === "new" ? "assigned" : req.status });

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
        {lang === "ar" ? <ChevronRight size={16} /> : <ArrowLeft size={16} />} {t.requests}
      </button>

      <Card className="p-5 sm:p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <CategoryIcon id={req.category} size={20} />
            <div>
              <p className="font-bold text-lg text-slate-900 dark:text-white">{cat[lang]} — {req.id}</p>
              <p className="text-sm text-slate-400">{req.building}, Unit {req.unit} {role !== "tenant" ? `· ${req.tenant}` : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Pill color={prio.color} bg={prio.bg}>{prio[lang]}</Pill>
            <Pill color={st.color} bg={st.bg}>{st[lang]}</Pill>
          </div>
        </div>

        <StatusPipeline status={req.status} lang={lang} />

        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p className="text-slate-400 text-xs mb-1">{t.description}</p>
            <p className="text-slate-700 dark:text-slate-200">{req.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs mb-1">{t.preferredTime}</p>
              <p className="text-slate-700 dark:text-slate-200">{req.preferredTime}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Submitted</p>
              <p className="text-slate-700 dark:text-slate-200">{fmtDate(req.createdAt, lang)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Technician</p>
              <p className="text-slate-700 dark:text-slate-200">{tech ? tech.name : "Unassigned"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Attachments</p>
              <p className="text-slate-700 dark:text-slate-200 flex items-center gap-1"><Camera size={14} /> {req.photos} files</p>
            </div>
          </div>
        </div>
      </Card>

      {/* COORDINATOR CONTROLS */}
      {role === "coordinator" && (
        <Card className="p-5 sm:p-6 mb-5">
          <p className="font-semibold text-slate-900 dark:text-white mb-4">{t.assignTechnician}</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t.assignTechnician}</label>
              <select
                value={req.technician || ""}
                onChange={(e) => assignTech(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {TECHNICIANS.map((tc) => (
                  <option key={tc.id} value={tc.id}>{tc.name} — {catInfo(tc.specialty).en} ({tc.active} active)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t.changeStatus}</label>
              <select
                value={req.status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s[lang]}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="font-semibold text-slate-900 dark:text-white mb-3">{t.internalNotes}</p>
          <div className="space-y-2.5 mb-3 max-h-44 overflow-y-auto">
            {req.notes.length === 0 && <p className="text-sm text-slate-400 italic">No notes yet.</p>}
            {req.notes.map((n, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5">
                <p className="text-sm text-slate-700 dark:text-slate-200">{n.text}</p>
                <p className="text-[11px] text-slate-400 mt-1">{n.by} · {fmtDate(n.at, lang)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.addNote}
              className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="secondary" onClick={addNote}>{t.addNote}</Button>
          </div>
        </Card>
      )}

      {/* TECHNICIAN CONTROLS */}
      {role === "technician" && (
        <Card className="p-5 sm:p-6 mb-5">
          <p className="font-semibold text-slate-900 dark:text-white mb-4">Job Actions</p>
          {req.status === "assigned" && (
            <div className="flex gap-2 mb-5">
              <Button variant="success" onClick={() => setStatus("in_progress")}><CheckCircle2 size={16} /> {t.acceptJob}</Button>
              <Button variant="danger" onClick={() => setStatus("new")}><XCircle size={16} /> {t.rejectJob}</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-5">
            <Button variant={req.status === "in_progress" ? "primary" : "secondary"} onClick={() => setStatus("in_progress")}>
              <PlayCircle size={16} /> In Progress
            </Button>
            <Button variant={req.status === "waiting_parts" ? "primary" : "secondary"} onClick={() => setStatus("waiting_parts")}>
              <PauseCircle size={16} /> Waiting for Parts
            </Button>
            <Button variant="success" onClick={() => setStatus("completed")}>
              <CheckCircle2 size={16} /> {t.markComplete}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <button className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-4 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Camera size={16} /> Upload before photo
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-4 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Camera size={16} /> Upload after photo
            </button>
          </div>
          <label className="text-xs text-slate-400 mb-1.5 block">{t.materialsUsed}</label>
          <div className="flex gap-2 mb-2">
            <input
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. 1x capacitor, refrigerant gas"
              className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="secondary"
              onClick={() => { if (materials.trim()) { onUpdate(req.id, { notes: [...req.notes, { by: tech ? tech.name : "Technician", text: `Materials used: ${materials.trim()}`, at: new Date().toISOString() }] }); setMaterials(""); } }}
            >
              <Package size={16} /> Log
            </Button>
          </div>
        </Card>
      )}

      {/* TENANT RATING */}
      {role === "tenant" && req.status === "completed" && (
        <Card className="p-5 sm:p-6 mb-5">
          <p className="font-semibold text-slate-900 dark:text-white mb-1">{t.rate}</p>
          <p className="text-sm text-slate-400 mb-3">Confirm the job is done and close this request.</p>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={26}
                className={`cursor-pointer ${(req.rating || 0) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                onClick={() => onUpdate(req.id, { rating: n })}
              />
            ))}
          </div>
          <Button onClick={() => setStatus("closed")}><ThumbsUp size={16} /> Confirm & Close Request</Button>
        </Card>
      )}

      {/* CHAT */}
      <Card className="p-5 sm:p-6">
        <p className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><MessageSquare size={17} /> {t.chatWith}</p>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {req.chat.length === 0 && <p className="text-sm text-slate-400 italic">No messages yet — say hello.</p>}
          {req.chat.map((c, i) => (
            <div key={i} className={`flex ${c.from === "tenant" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${c.from === "tenant" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm"}`}>
                <p>{c.text}</p>
                <p className={`text-[10px] mt-1 ${c.from === "tenant" ? "text-blue-100" : "text-slate-400"}`}>{fmtDate(c.at, lang)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Type a message..."
            className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={sendChat}><Send size={16} /></Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================== TENANT PAGES ============================== */

function TenantDashboard({ requests, lang, t, onOpen, goNew }) {
  const mine = requests.filter((r) => r.unit === CURRENT_TENANT.unit);
  const open = mine.filter((r) => !["completed", "closed"].includes(r.status));
  const completed = mine.filter((r) => ["completed", "closed"].includes(r.status));
  const emergency = mine.filter((r) => r.priority === "emergency" && !["closed"].includes(r.status));

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7 bg-gradient-to-br from-blue-600 to-sky-500 border-none text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold mb-4">{CURRENT_TENANT.name}</h2>
        <p className="text-sm text-blue-50 mb-5 max-w-md">{CURRENT_TENANT.building} · Unit {CURRENT_TENANT.unit} — have an issue? Submit it in under a minute, no more waiting on WhatsApp replies.</p>
        <Button variant="success" className="!bg-white !text-blue-700 hover:!bg-blue-50" onClick={goNew}>
          <Plus size={16} /> {t.newRequest}
        </Button>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label={t.totalRequests} value={mine.length} accent="#2563EB" />
        <StatCard icon={Clock} label={t.openRequests} value={open.length} accent="#F59E0B" />
        <StatCard icon={CheckCircle2} label={t.completedRequests} value={completed.length} accent="#10B981" />
        <StatCard icon={AlertTriangle} label={t.emergencyRequests} value={emergency.length} accent="#EF4444" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 dark:text-white">Active Requests</h3>
        </div>
        {open.length === 0 ? (
          <Card><EmptyState icon={CheckCircle2} title="All caught up" sub="You have no open maintenance requests right now." /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {open.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function NewRequestForm({ t, lang, onSubmit, goBack }) {
  const [category, setCategory] = useState("ac");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const submit = () => {
    if (!description.trim()) return;
    onSubmit({ category, priority, description: description.trim(), preferredTime: preferredTime || "Anytime", photos: files.length });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-5 sm:p-7">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t.submitRequest}</h2>
        <p className="text-sm text-slate-400 mb-6">{CURRENT_TENANT.building} · Unit {CURRENT_TENANT.unit}</p>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2.5 block">{t.category}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-6">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border-2 text-xs font-medium transition-colors ${
                  active ? "border-blue-500 bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Icon size={18} />
                {c[lang]}
              </button>
            );
          })}
        </div>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2.5 block">{t.priority}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {PRIORITIES.map((p) => {
            const active = priority === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className="rounded-xl py-2.5 px-2 border-2 text-xs font-semibold transition-colors"
                style={{
                  borderColor: active ? p.color : "#E2E8F0",
                  backgroundColor: active ? p.bg : "transparent",
                  color: active ? p.color : "#64748B",
                }}
              >
                {p[lang]}
              </button>
            );
          })}
        </div>

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">{t.description}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the issue in detail — what's wrong, since when, anything that helps the technician prepare."
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">{t.preferredTime}</label>
        <input
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          placeholder="e.g. Tomorrow morning, Weekend, Anytime"
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">{t.uploadPhotos}</label>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files))} />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-7 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 mb-2"
        >
          <Camera size={22} />
          {files.length ? `${files.length} file(s) selected` : "Tap to add photos or a short video"}
        </button>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={goBack} className="flex-1">Cancel</Button>
          <Button onClick={submit} className="flex-1" disabled={!description.trim()}>{t.submit}</Button>
        </div>
      </Card>
    </div>
  );
}

function TenantRequests({ requests, lang, t, onOpen }) {
  const mine = requests.filter((r) => r.unit === CURRENT_TENANT.unit);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? mine : mine.filter((r) => r.status === filter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === "all" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{t.all}</button>
        {STATUSES.map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === s.id ? "text-white" : "text-slate-500 dark:text-slate-300"}`} style={{ backgroundColor: filter === s.id ? s.color : undefined }}>
            <span className={filter === s.id ? "" : "bg-slate-100 dark:bg-slate-800 px-0 py-0 rounded-full"}>{s[lang]}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card><EmptyState icon={Search} title="No requests found" sub="Try a different filter." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function TenantProfile({ t, lang, requests }) {
  const myReqs = (requests || []).filter((r) => r.unit === CURRENT_TENANT.unit);
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center text-xl font-bold">AF</div>
        <div>
          <p className="font-bold text-lg text-slate-900 dark:text-white">{CURRENT_TENANT.name}</p>
          <p className="text-sm text-slate-400">{CURRENT_TENANT.email}</p>
        </div>
      </Card>
      <Card className="p-6">
        <p className="font-semibold text-slate-900 dark:text-white mb-4">{t.apartmentInfo}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs mb-1">Building</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TENANT.building}</p></div>
          <div><p className="text-slate-400 text-xs mb-1">Unit</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TENANT.unit}</p></div>
          <div><p className="text-slate-400 text-xs mb-1">Phone</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TENANT.phone}</p></div>
          <div><p className="text-slate-400 text-xs mb-1">Move-in Date</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TENANT.moveIn}</p></div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500"><QrCode size={18} /> Apartment QR code</div>
          <div className="w-14 h-14 rounded-lg bg-slate-900 dark:bg-slate-700 flex items-center justify-center"><QrCode size={28} className="text-white" /></div>
        </div>
      </Card>
      <Card className="p-6">
        <p className="font-semibold text-slate-900 dark:text-white mb-4">{t.history}</p>
        <p className="text-sm text-slate-500">{myReqs.length} total requests · {myReqs.filter(r=>r.status==="closed").length} closed</p>
      </Card>
    </div>
  );
}

/* ============================== COORDINATOR PAGES ============================== */

const PIE_COLORS = ["#2563EB", "#0EA5E9", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#64748B"];

function CoordinatorDashboard({ requests, lang, t, onOpen, goRequests }) {
  const open = requests.filter((r) => !["completed", "closed"].includes(r.status));
  const completed = requests.filter((r) => ["completed", "closed"].includes(r.status));
  const emergency = requests.filter((r) => r.priority === "emergency");

  const byStatus = useMemo(() => STATUSES.map((s) => ({ name: s[lang], value: requests.filter((r) => r.status === s.id).length, color: s.color })), [requests, lang]);
  const byCategory = useMemo(() => CATEGORIES.map((c) => ({ name: c[lang], value: requests.filter((r) => r.category === c.id).length })).filter((c) => c.value > 0), [requests, lang]);
  const trend = [
    { month: "Jan", requests: 18 }, { month: "Feb", requests: 22 }, { month: "Mar", requests: 19 },
    { month: "Apr", requests: 27 }, { month: "May", requests: 24 }, { month: "Jun", requests: requests.length },
  ];

  const urgent = requests.filter((r) => r.priority === "emergency" && r.status !== "closed");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label={t.totalRequests} value={requests.length} accent="#2563EB" />
        <StatCard icon={Clock} label={t.openRequests} value={open.length} accent="#F59E0B" />
        <StatCard icon={CheckCircle2} label={t.completedRequests} value={completed.length} accent="#10B981" />
        <StatCard icon={AlertTriangle} label={t.emergencyRequests} value={emergency.length} accent="#EF4444" sub="2.4h avg response" />
      </div>

      {urgent.length > 0 && (
        <Card className="p-4 border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20">
          <div className="flex items-center gap-2 mb-2 text-red-600 font-semibold text-sm"><AlertTriangle size={16} /> {urgent.length} emergency request(s) need attention</div>
          <div className="flex flex-wrap gap-2">
            {urgent.map((r) => (
              <button key={r.id} onClick={() => onOpen(r)} className="text-xs font-medium bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">
                {r.id} · {r.building} {r.unit}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <p className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={16} /> {t.monthlyReport}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="requests" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <p className="font-semibold text-slate-900 dark:text-white mb-4">{t.byStatus}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {byStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <p className="font-semibold text-slate-900 dark:text-white mb-4">{t.byCategory}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white">Recent Requests</h3>
        <button onClick={goRequests} className="text-sm text-blue-600 font-semibold flex items-center gap-1">View all <ChevronRight size={14} /></button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.slice(0, 6).map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} showTenant />)}
      </div>
    </div>
  );
}

function CoordinatorRequests({ requests, lang, t, onOpen }) {
  const [filters, setFilters] = useState({ status: "all", building: "all", technician: "all", priority: "all", category: "all" });
  const [search, setSearch] = useState("");

  const filtered = requests.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.building !== "all" && r.building !== filters.building) return false;
    if (filters.technician !== "all" && r.technician !== filters.technician) return false;
    if (filters.priority !== "all" && r.priority !== filters.priority) return false;
    if (filters.category !== "all" && r.category !== filters.category) return false;
    if (search && !(r.id.toLowerCase().includes(search.toLowerCase()) || r.tenant.toLowerCase().includes(search.toLowerCase()) || r.unit.includes(search))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <FilterBar
        t={t}
        filters={filters}
        setFilters={setFilters}
        options={[
          { key: "status", label: t.status, values: STATUSES },
          { key: "building", label: "Building", values: BUILDINGS },
          { key: "technician", label: "Technician", values: TECHNICIANS.map((x) => ({ id: x.id, en: x.name })) },
          { key: "priority", label: t.priority, values: PRIORITIES },
          { key: "category", label: t.category, values: CATEGORIES },
        ]}
      />
      <p className="text-xs text-slate-400">{filtered.length} of {requests.length} requests</p>
      {filtered.length === 0 ? (
        <Card><EmptyState icon={Search} title="No matching requests" sub="Try adjusting your filters." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} showTenant />)}
        </div>
      )}
    </div>
  );
}

function CoordinatorTechnicians({ requests, t }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {TECHNICIANS.map((tc) => {
        const jobs = requests.filter((r) => r.technician === tc.id && !["completed", "closed"].includes(r.status));
        const cat = catInfo(tc.specialty);
        return (
          <Card key={tc.id} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center font-bold">
                {tc.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{tc.name}</p>
                <p className="text-xs text-slate-400">{tc.phone}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Pill color={cat.color} bg={cat.color + "1A"}>{cat.en} specialist</Pill>
              <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star size={14} className="fill-amber-400" /> {tc.rating}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-500">Active jobs</span>
              <span className="font-bold text-slate-900 dark:text-white">{jobs.length}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CoordinatorReports({ requests, t }) {
  const avgRating = (requests.filter((r) => r.rating).reduce((a, r) => a + r.rating, 0) / (requests.filter((r) => r.rating).length || 1)).toFixed(1);
  const byBuilding = BUILDINGS.map((b) => ({ name: b, value: requests.filter((r) => r.building === b).length }));
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="font-semibold text-slate-900 dark:text-white">Monthly Maintenance Report — June 2026</p>
          <div className="flex gap-2">
            <Button variant="secondary"><Download size={15} /> {t.exportPDF}</Button>
            <Button variant="secondary"><Download size={15} /> {t.exportExcel}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{requests.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Requests</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">1.8 days</p>
            <p className="text-xs text-slate-400 mt-1">{t.avgCompletion}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgRating}<span className="text-sm text-slate-400">/5</span></p>
            <p className="text-xs text-slate-400 mt-1">Avg. Tenant Rating</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">96%</p>
            <p className="text-xs text-slate-400 mt-1">SLA Compliance</p>
          </div>
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <p className="font-semibold text-slate-900 dark:text-white mb-4">Requests by Building</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byBuilding} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ============================== TECHNICIAN PAGES ============================== */

let CURRENT_TECH = TECHNICIANS[0];

function TechnicianDashboard({ requests, lang, t, onOpen }) {
  const mine = requests.filter((r) => r.technician === CURRENT_TECH.id);
  const todo = mine.filter((r) => !["completed", "closed"].includes(r.status));
  const pendingAccept = mine.filter((r) => r.status === "assigned");
  const completedToday = mine.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-600 to-sky-500 border-none text-white">
        <p className="text-blue-100 text-sm mb-1">Hello,</p>
        <h2 className="text-2xl font-bold mb-1">{CURRENT_TECH.name}</h2>
        <p className="text-sm text-blue-50">{catInfo(CURRENT_TECH.specialty).en} Specialist · {todo.length} active jobs today</p>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Active Jobs" value={todo.length} accent="#2563EB" />
        <StatCard icon={Bell} label="Pending Accept" value={pendingAccept.length} accent="#F59E0B" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedToday} accent="#10B981" />
      </div>

      {pendingAccept.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">Awaiting your response</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {pendingAccept.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} showTenant />)}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Today's Jobs</h3>
        {todo.length === 0 ? (
          <Card><EmptyState icon={CheckCircle2} title="No jobs assigned" sub="New assignments will appear here." /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {todo.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} showTenant />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TechnicianRequests({ requests, lang, t, onOpen }) {
  const mine = requests.filter((r) => r.technician === CURRENT_TECH.id);
  return (
    <div className="space-y-4">
      {mine.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No jobs yet" /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {mine.map((r) => <RequestCard key={r.id} req={r} lang={lang} t={t} onOpen={onOpen} showTenant />)}
        </div>
      )}
    </div>
  );
}

function TechnicianProfile({ t }) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center text-xl font-bold">KS</div>
        <div>
          <p className="font-bold text-lg text-slate-900 dark:text-white">{CURRENT_TECH.name}</p>
          <p className="text-sm text-slate-400">{catInfo(CURRENT_TECH.specialty).en} Specialist</p>
        </div>
      </Card>
      <Card className="p-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-slate-400 text-xs mb-1">Phone</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TECH.phone}</p></div>
        <div><p className="text-slate-400 text-xs mb-1">Rating</p><p className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {CURRENT_TECH.rating}</p></div>
        <div><p className="text-slate-400 text-xs mb-1">Active Jobs</p><p className="text-slate-700 dark:text-slate-200 font-medium">{CURRENT_TECH.active}</p></div>
        <div><p className="text-slate-400 text-xs mb-1">Specialty</p><p className="text-slate-700 dark:text-slate-200 font-medium">{catInfo(CURRENT_TECH.specialty).en}</p></div>
      </Card>
    </div>
  );
}

/* ============================== LOGIN SCREEN ============================== */

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || "Couldn't send the link. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-7">
        <div className="flex justify-center mb-5">
          <Logo />
        </div>
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={22} />
            </div>
            <p className="font-semibold text-slate-900 mb-1">Check your email</p>
            <p className="text-sm text-slate-500">We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this device to log in.</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="font-semibold text-slate-900 text-center mb-1">Sign in to Wareef</p>
            <p className="text-sm text-slate-500 text-center mb-5">Enter your email and we'll send you a secure sign-in link — no password needed.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}



const TITLE_MAP = {
  tenant: { dashboard: "dashboard", new: "newRequest", requests: "myRequests", profile: "profile" },
  coordinator: { dashboard: "dashboard", requests: "requests", technicians: "technicians", reports: "reports" },
  technician: { dashboard: "myJobs", requests: "requests", profile: "profile" },
};

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState(null);

  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const t = T[lang];

  // Check for an existing session on load, and keep listening for sign-in/out.
  React.useEffect(() => {
    let cancelled = false;
    getSession().then((s) => { if (!cancelled) setSession(s); });
    const unsubscribe = onAuthStateChange((s) => setSession(s));
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // Once signed in, load this person's profile row (role, name, etc).
  React.useEffect(() => {
    if (!session) { setProfile(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchMyProfile(session.user.id);
        if (!cancelled) {
          setProfile(p);
          setAuthError(p ? null : "Your account isn't linked to a profile yet. Ask your coordinator to add you.");
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
        if (!cancelled) setAuthError(e.message || "Couldn't load your profile.");
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const role = profile?.role === "admin" ? "coordinator" : profile?.role || "tenant";

  // Load technicians list + (for tenants) unit context, whenever the profile changes.
  React.useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const techs = await fetchTechnicians();
        if (cancelled) return;
        TECHNICIANS.length = 0;
        TECHNICIANS.push(...techs.map((x) => ({ ...x, active: 0 })));
        CURRENT_TECH = TECHNICIANS.find((x) => x.id === profile.id) || TECHNICIANS[0] || CURRENT_TECH;

        if (role === "tenant") {
          const tenantCtx = await getTenantContext(profile.id);
          if (cancelled) return;
          Object.assign(CURRENT_TENANT, {
            name: tenantCtx.name,
            unit: tenantCtx.unitNumber,
            building: tenantCtx.buildingName,
            phone: tenantCtx.phone || CURRENT_TENANT.phone,
            email: tenantCtx.email || CURRENT_TENANT.email,
            moveIn: tenantCtx.moveIn || CURRENT_TENANT.moveIn,
          });
          CURRENT_TENANT._unitId = tenantCtx.unitId;
        }
        setRefreshKey((k) => k + 1);
      } catch (e) {
        console.error("Failed to load technicians/tenant profile:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [profile, role]);

  // Load the request list whenever the role (or refreshKey) changes.
  React.useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let data;
        if (role === "tenant") {
          if (!CURRENT_TENANT._unitId) {
            const ctx = await getTenantContext(profile.id);
            CURRENT_TENANT._unitId = ctx.unitId;
          }
          data = CURRENT_TENANT._unitId ? await fetchRequestsForUnit(CURRENT_TENANT._unitId) : [];
        } else if (role === "coordinator") {
          data = await fetchAllRequests();
        } else {
          data = await fetchRequestsForTechnician(profile.id);
        }
        if (!cancelled) setRequests(data);
      } catch (e) {
        console.error("Failed to load requests:", e);
        if (!cancelled) setLoadError(e.message || "Could not load requests from the database.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile, role, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const openRequest = async (r) => {
    setSelected(r);
    try {
      const detail = await fetchRequestDetail(r.dbId);
      setSelected((s) => (s && s.dbId === r.dbId ? { ...s, ...detail } : s));
      setRequests((rs) => rs.map((x) => (x.dbId === r.dbId ? { ...x, ...detail } : x)));
    } catch (e) {
      console.error("Failed to load request detail:", e);
    }
  };

  const liveSelected = selected ? requests.find((r) => r.dbId === selected.dbId) || selected : null;

  // Generic patch used by RequestDetail for chat + notes (writes through to Supabase).
  const updateRequest = async (id, patch) => {
    const req = requests.find((r) => r.id === id) || selected;
    if (!req || !profile) return;
    try {
      if (patch.status && patch.status !== req.status) {
        await updateRequestStatus(req.dbId, patch.status, profile.id, req.status);
      }
      if ("technician" in patch) {
        await assignTechnician(req.dbId, patch.technician, req.status);
      }
      if (patch.notes && patch.notes.length > req.notes.length) {
        const newest = patch.notes[patch.notes.length - 1];
        await addNote(req.dbId, profile.id, newest.text);
      }
      if (patch.chat && patch.chat.length > req.chat.length) {
        const newest = patch.chat[patch.chat.length - 1];
        await sendChatMessage(req.dbId, profile.id, newest.text);
      }
      if (typeof patch.rating === "number") {
        await submitRating(req.dbId, patch.rating);
      }
      // optimistic local update so the UI feels instant, then quietly resync
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
    } catch (e) {
      console.error("Failed to save change:", e);
      alert("Sorry, that change couldn't be saved. Please try again.");
    }
  };

  const submitNewRequest = async (form) => {
    if (!profile) return;
    try {
      const unitId = CURRENT_TENANT._unitId;
      if (!unitId) {
        alert("Your tenant profile isn't linked to a unit yet — check the tenant_units table in Supabase.");
        return;
      }
      await createRequest({
        unitId,
        tenantId: profile.id,
        category: form.category,
        priority: form.priority,
        description: form.description,
        preferredTime: form.preferredTime,
      });
      setView("requests");
      refetch();
    } catch (e) {
      console.error("Failed to submit request:", e);
      alert("Sorry, that request couldn't be submitted. Please try again.");
    }
  };

  const handleLogout = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  // ---- Render states for the auth lifecycle ----
  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }
  if (!session) {
    return <LoginScreen />;
  }
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6 text-center">
          <p className="font-semibold text-red-600 mb-2">Can't load your account</p>
          <p className="text-sm text-slate-500 mb-4">{authError}</p>
          <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
        </Card>
      </div>
    );
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading your profile…</div>;
  }

  let body;
  if (liveSelected) {
    body = <RequestDetail req={liveSelected} lang={lang} t={t} role={role} onBack={() => setSelected(null)} onUpdate={updateRequest} />;
  } else if (loading) {
    body = <div className="text-center py-20 text-slate-400 text-sm">Loading your data…</div>;
  } else if (loadError) {
    body = (
      <Card className="p-6 text-center">
        <p className="font-semibold text-red-600 mb-1">Couldn't load data from the database</p>
        <p className="text-sm text-slate-500">{loadError}</p>
      </Card>
    );
  } else if (role === "tenant") {
    if (view === "dashboard") body = <TenantDashboard requests={requests} lang={lang} t={t} onOpen={openRequest} goNew={() => setView("new")} />;
    else if (view === "new") body = <NewRequestForm t={t} lang={lang} onSubmit={submitNewRequest} goBack={() => setView("dashboard")} />;
    else if (view === "requests") body = <TenantRequests requests={requests} lang={lang} t={t} onOpen={openRequest} />;
    else body = <TenantProfile t={t} lang={lang} requests={requests} />;
  } else if (role === "coordinator") {
    if (view === "dashboard") body = <CoordinatorDashboard requests={requests} lang={lang} t={t} onOpen={openRequest} goRequests={() => setView("requests")} />;
    else if (view === "requests") body = <CoordinatorRequests requests={requests} lang={lang} t={t} onOpen={openRequest} />;
    else if (view === "technicians") body = <CoordinatorTechnicians requests={requests} t={t} />;
    else body = <CoordinatorReports requests={requests} t={t} />;
  } else {
    if (view === "dashboard") body = <TechnicianDashboard requests={requests} lang={lang} t={t} onOpen={openRequest} />;
    else if (view === "requests") body = <TechnicianRequests requests={requests} lang={lang} t={t} onOpen={openRequest} />;
    else body = <TechnicianProfile t={t} />;
  }

  const titleKey = TITLE_MAP[role][view] || "dashboard";
  const title = liveSelected ? t.requestDetail : t[titleKey];
  const displayName = profile.full_name || profile.email;
  const initials = (displayName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex">
        <Sidebar role={role} t={t} view={view} setView={(v) => { setView(v); setSelected(null); }} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} lang={lang} onLogout={handleLogout} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark} role={role} displayName={displayName} initials={initials} setMobileOpen={setMobileOpen} title={title} notifCount={requests.filter(r=>r.priority==="emergency"&&r.status!=="closed").length} />
          <main className="flex-1 p-4 sm:p-6">{body}</main>
        </div>
      </div>
    </div>
  );
}
