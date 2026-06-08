import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Settings, 
  LogOut, 
  Compass, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Trophy, 
  KeyRound, 
  Award,
  ChevronRight,
  BookMarked,
  Printer,
  FileText,
  UserCheck,
  Building,
  Lock,
  Edit,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";

interface StudentPortalProps {
  onLogout: () => void;
}

export default function StudentPortal({ onLogout }: StudentPortalProps) {
  // Auth view states
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  // Login states
  const [loginStudentId, setLoginStudentId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register states
  const [regStudentId, setRegStudentId] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSession, setRegSession] = useState("Spring 2026");
  const [regPassword, setRegPassword] = useState("");
  const [regDeptId, setRegDeptId] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Dashboard state
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicResults, setAcademicResults] = useState<any | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<"overview" | "grades" | "teachers" | "settings">("overview");
  const [dashLoading, setDashLoading] = useState(false);

  // Profile update settings
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Load basic configurations
  useEffect(() => {
    fetchDepartments();
    // Check local session store for persistent login within tab
    const savedUser = localStorage.getItem("neub_student_session");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem("neub_student_session");
      }
    }
  }, []);

  // Fetch results when current student logins
  useEffect(() => {
    if (currentUser) {
      loadStudentResults();
      setEditEmail(currentUser.email || "");
      setEditPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudentResults = async () => {
    if (!currentUser) return;
    setDashLoading(true);
    try {
      // Find results of this specific student id
      const res = await fetch(`/api/search?student_id=${encodeURIComponent(currentUser.student_id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setAcademicResults(json.data[0]);
        } else {
          setAcademicResults({
            student_id: currentUser.student_id,
            student_name: currentUser.name,
            department_code: departments.find(d => d.id === currentUser.department_id)?.code || "N/A",
            semester: currentUser.session || "Spring 2026",
            passing_year: "2026",
            courses: []
          });
        }
      }
    } catch (e) {
      console.error("Error fetching student records", e);
    } finally {
      setDashLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: loginStudentId.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("neub_student_session", JSON.stringify(data.student));
        setCurrentUser(data.student);
      } else {
        setLoginError(data.message || "Invalid credentials provided.");
      }
    } catch (err) {
      setLoginError("Verification failed due to connection error.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    if (!regDeptId) {
      setRegError("Please select your academic department.");
      setRegLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: regStudentId.trim(),
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          session: regSession.trim(),
          password: regPassword,
          department_id: Number(regDeptId)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess("Your student dashboard account is activated! Redirecting to Sign In...");
        setRegStudentId("");
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setRegDeptId("");
        setTimeout(() => {
          setAuthTab("signin");
          setRegSuccess("");
        }, 3000);
      } else {
        setRegError(data.message || "Failed to create account.");
      }
    } catch (err) {
      setRegError("Network fault encountered. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setProfileLoading(true);

    try {
      const res = await fetch("/api/student/profile-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: currentUser.student_id,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMessage("Your profile information has been securely updated!");
        localStorage.setItem("neub_student_session", JSON.stringify(data.student));
        setCurrentUser(data.student);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setProfileError(data.message || "Failed to submit profile edits.");
      }
    } catch (err) {
      setProfileError("Communication error applying modifications.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("neub_student_session");
    setCurrentUser(null);
    setAcademicResults(null);
  };

  // Static Calculation functions
  const calculateCGPA = (coursesList: any[]) => {
    if (!coursesList || coursesList.length === 0) return { cgpa: "0.00", totalCredits: 0 };
    
    let totalGradePoints = 0;
    let totalCredits = 0;

    coursesList.forEach(course => {
      const ch = Number(course.credit) || 3;
      const pts = parseFloat(course.points) || 0;
      // Skip courses that are non-calculated or "F" grades unless we specifically count credits
      totalGradePoints += (pts * ch);
      totalCredits += ch;
    });

    if (totalCredits === 0) return { cgpa: "0.00", totalCredits: 0 };
    return {
      cgpa: (totalGradePoints / totalCredits).toFixed(2),
      totalCredits
    };
  };

  // Group Courses by Semesters
  const getSemesterGrades = (coursesList: any[]) => {
    if (!coursesList) return {};
    // Note: Since individual courses don't have distinct semester fields,
    // we use the main search's passing semester/year, or fallback cleanly.
    return { [academicResults?.semester || "Current Term"]: coursesList };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Dynamic Header */}
      <header className="bg-slate-950 border-b border-slate-800 shadow-lg px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-950 shadow">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold font-serif tracking-tight text-white">
                HEUB Portal <span className="text-xs text-amber-500 font-mono">NEUB</span>
              </h1>
              <p className="text-[10px] text-slate-400 capitalize tracking-wider hidden sm:block">
                Digital Student Account & Course Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-2 mr-3 border-r border-slate-800 pr-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {currentUser.name}
                </span>
              </div>
            )}
            <button
              onClick={currentUser ? handleLogout : onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{currentUser ? "Sign Out" : "Exit Portal"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {/* VIEW 1: AUTHENTICATION ENTRANCE (NOT LOGGED IN) */}
        {!currentUser && (
          <div className="max-w-md mx-auto my-12 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Tab switchers */}
            <div className="flex border-b border-slate-800 text-sm">
              <button
                onClick={() => { setAuthTab("signin"); setLoginError(""); setRegError(""); }}
                className={`flex-1 py-4 text-center font-bold transition-all ${
                  authTab === "signin" 
                    ? "bg-slate-900/50 text-amber-400 border-b-2 border-amber-500" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In to Portal
              </button>
              <button
                onClick={() => { setAuthTab("register"); setLoginError(""); setRegError(""); }}
                className={`flex-1 py-4 text-center font-bold transition-all ${
                  authTab === "register" 
                    ? "bg-slate-900/50 text-amber-400 border-b-2 border-amber-500" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* BRAND GREETING */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold font-serif text-white">
                  {authTab === "signin" ? "Welcome Back Students" : "Activate Portal Profile"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access official academic ledger archives & instructor breakdowns
                </p>
              </div>

              {/* MESSAGES */}
              {loginError && (
                <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full shrink-0"></span>
                  <span>{loginError}</span>
                </div>
              )}
              {regError && (
                <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full shrink-0"></span>
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-950 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0 animate-ping"></span>
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* ROUTE A: SIGN INFORM */}
              {authTab === "signin" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Student ID Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginStudentId}
                        onChange={(e) => setLoginStudentId(e.target.value)}
                        placeholder="e.g. 210203040"
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Account Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your security password"
                        className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                      <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    {loginLoading ? "Verifying Credentials..." : "Access My Dashboard"}
                  </button>
                </form>
              ) : (
                /* ROUTE B: REGISTER FORM */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Student ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      placeholder="e.g. 210202021"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Saklan Rahman"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Department Select *
                      </label>
                      <select
                        required
                        value={regDeptId}
                        onChange={(e) => setRegDeptId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                      >
                        <option value="">Choose...</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.code}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Academic Session *
                      </label>
                      <input
                        type="text"
                        required
                        value={regSession}
                        onChange={(e) => setRegSession(e.target.value)}
                        placeholder="e.g. Fall 2025"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ID@neub.edu.bd"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Mobile Phone
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+88017..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Establish Secure Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition text-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-50 font-bold rounded-xl transition mt-5 cursor-pointer"
                  >
                    {regLoading ? "Registering Student Details..." : "Perform Registry Activation"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL-FEATURED LOGGED IN DASHBOARD */}
        {currentUser && (
          <div className="space-y-6">
            
            {/* STUDENT HERO HIGHLIGHT HEADER */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4.5">
                <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 rounded-2xl flex items-center justify-center font-bold font-serif text-2xl shadow-lg relative">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "S"}
                  <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white rounded-full p-0.5 border border-slate-950">
                    <User className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{currentUser.name}</h2>
                    <span className="px-2.5 py-0.5 bg-teal-900/40 border border-teal-800 text-teal-400 text-[10px] uppercase font-bold rounded-full">
                      Active Student
                    </span>
                  </div>
                  <p className="text-xs text-amber-400 font-mono font-medium mt-1">
                    Student ID: {currentUser.student_id} &bull; Dept ID: {departments.find(d => d.id === currentUser.department_id)?.code || currentUser.department_id}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Registered Session: <strong className="text-slate-300 font-medium">{currentUser.session || "Spring 2026"}</strong>
                  </p>
                </div>
              </div>

              {/* CGPA OVERVIEW CARD */}
              <div className="w-full md:w-auto flex grid-cols-2 md:grid-cols-1 items-center gap-3">
                <div className="flex-grow md:flex-none p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center md:text-left min-w-[140px] shadow">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cumulative CGPA</span>
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    {calculateCGPA(academicResults?.courses || []).cgpa}
                  </span>
                </div>
                <div className="flex-grow md:flex-none p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center md:text-left min-w-[140px] shadow">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Completed CH</span>
                  <span className="text-2xl font-bold text-slate-100 font-mono">
                    {calculateCGPA(academicResults?.courses || []).totalCredits} Credits
                  </span>
                </div>
              </div>
            </div>

            {/* SEGMENT SWITCHING NAVIGATION */}
            <div className="flex border-b border-slate-850 gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                onClick={() => setActiveDashboardTab("overview")}
                className={`px-5 py-3.5 text-xs font-bold rounded-t-xl tracking-wider uppercase transition-all shrink-0 ${
                  activeDashboardTab === "overview"
                    ? "bg-slate-950 text-amber-400 border-t-2 border-amber-500"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveDashboardTab("grades")}
                className={`px-5 py-3.5 text-xs font-bold rounded-t-xl tracking-wider uppercase transition-all shrink-0 ${
                  activeDashboardTab === "grades"
                    ? "bg-slate-950 text-amber-400 border-t-2 border-amber-500"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Academic Records</span>
                </div>
              </button>
              <button
                onClick={() => setActiveDashboardTab("teachers")}
                className={`px-5 py-3.5 text-xs font-bold rounded-t-xl tracking-wider uppercase transition-all shrink-0 ${
                  activeDashboardTab === "teachers"
                    ? "bg-slate-950 text-amber-400 border-t-2 border-amber-500"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Course Instructors</span>
                </div>
              </button>
              <button
                onClick={() => setActiveDashboardTab("settings")}
                className={`px-5 py-3.5 text-xs font-bold rounded-t-xl tracking-wider uppercase transition-all shrink-0 ${
                  activeDashboardTab === "settings"
                    ? "bg-slate-950 text-amber-400 border-t-2 border-amber-500"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Account security</span>
                </div>
              </button>
            </div>

            {/* TAB SCREENS AREA */}
            <div className="transition-all">
              
              {/* TAB 1: OVERVIEW ENGINE */}
              {activeDashboardTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Stats & progress cards */}
                  <div className="md:col-span-8 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-lg">
                      <h3 className="text-md sm:text-lg font-bold font-serif text-white tracking-tight flex items-center gap-2 mb-4">
                        <Trophy className="h-5 w-5 text-amber-400" />
                        A Academic Ledger Performance summary
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {/* Summary Block 1 */}
                        <div className="bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl relative overflow-hidden">
                          <span className="block text-xs font-semibold text-slate-400 mb-1">Academic Status</span>
                          <span className="text-md font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                            Good Standing (CGPA &gt; 2.00)
                          </span>
                          <p className="text-[10px] text-slate-500 mt-2">Eligible for registration and honors tracks.</p>
                        </div>

                        {/* Summary Block 2 */}
                        <div className="bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
                          <span className="block text-xs font-semibold text-slate-400 mb-1">Course Load</span>
                          <span className="text-md font-bold text-slate-200">
                            {academicResults?.courses ? academicResults.courses.length : 0} Enrolled Courses
                          </span>
                          <p className="text-[10px] text-slate-500 mt-2">Completed and graded courses mapped to Student ID.</p>
                        </div>
                      </div>

                      {/* Course list progress */}
                      <div className="mt-6 border-t border-slate-800/60 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Syllabus Breakdown</h4>
                        <div className="space-y-2">
                          {academicResults?.courses && academicResults.courses.length > 0 ? (
                            academicResults.courses.map((c: any, i: number) => {
                              const points = parseFloat(c.points) || 0;
                              const isPass = points > 0.0;
                              return (
                                <div key={i} className="flex justify-between items-center px-4 py-3 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-800/50 rounded-xl text-xs transition">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-semibold text-amber-500 font-mono w-[65px]">{c.code}</span>
                                    <span className="text-slate-300 font-medium truncate max-w-[180px] sm:max-w-[280px]">{c.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 text-[10px] uppercase font-mono">{c.credit} CH</span>
                                    <span className={`px-2 py-0.5 font-bold font-mono text-[10px] rounded shrink-0 ${
                                      isPass ? "bg-emerald-950/40 text-emerald-400 border border-emerald-950" : "bg-rose-950/40 text-rose-400 border border-rose-950"
                                    }`}>
                                      {c.grade} ({c.points})
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-slate-500 italic text-center py-6">No grades returned or bulk uploaded for this academic ID yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Contact Details / Quick access info */}
                  <div className="md:col-span-4 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-lg">
                      <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-4">Registry Details</h3>
                      
                      <div className="space-y-4 text-xs">
                        {/* Dept Info */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                            <Building className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold text-slate-500 uppercase">Department</span>
                            <strong className="text-slate-200">
                              {departments.find(d => d.id === currentUser.department_id)?.name || "Not Configured"}
                            </strong>
                          </div>
                        </div>

                        {/* Email Info */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold text-slate-500 uppercase">Student Email</span>
                            <strong className="text-slate-200">{currentUser.email || "N/A"}</strong>
                          </div>
                        </div>

                        {/* Phone Info */}
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold text-slate-500 uppercase">Contact Number</span>
                            <strong className="text-slate-200">{currentUser.phone || "N/A"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACADEMICS HONORS NOTICE */}
                    <div className="bg-gradient-to-br from-amber-900/10 to-teal-900/10 border border-amber-500/20 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-2">
                        <Award className="h-4 w-4" />
                        <span>University Dean's Notice</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        To earn honor positions, a student has to complete 15+ credits during term with CGPA exceeding 3.75 without failure marks. Keep up your focus!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DETAILED ACADEMIC GRADE TRANSCRIPT */}
              {activeDashboardTab === "grades" && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-md sm:text-lg font-bold font-serif text-white tracking-tight">Academic Grade Ledger</h3>
                      <p className="text-xs text-slate-400">Official transcript matching courses and registered grade points</p>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-300 font-bold transition flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Page</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto text-sm" id="print-area">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead className="bg-slate-900 text-slate-400 font-semibold">
                        <tr>
                          <th className="px-6 py-4.5 text-left">Course Code</th>
                          <th className="px-6 py-4.5 text-left">Course Title</th>
                          <th className="px-6 py-4.5 text-center">Credit Hours</th>
                          <th className="px-6 py-4.5 text-center">Letter Grade</th>
                          <th className="px-6 py-4.5 text-center">Grade Point</th>
                          <th className="px-6 py-4.5 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {academicResults?.courses && academicResults.courses.length > 0 ? (
                          academicResults.courses.map((course: any, i: number) => {
                            const pointVal = parseFloat(course.points) || 0;
                            return (
                              <tr key={i} className="hover:bg-slate-900/20">
                                <td className="px-6 py-4 font-mono font-bold text-amber-500">{course.code}</td>
                                <td className="px-6 py-4 font-medium text-slate-200">{course.title}</td>
                                <td className="px-6 py-4 text-center font-mono">{course.credit} CH</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                    pointVal >= 3.0 ? "bg-emerald-950/30 text-emerald-400" : (pointVal > 0 ? "bg-amber-950/30 text-amber-400" : "bg-rose-950/30 text-rose-400")
                                  }`}>
                                    {course.grade}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-semibold">{course.points}</td>
                                <td className="px-6 py-4 text-left font-mono text-[10px] text-slate-400">
                                  {course.remarks || (pointVal >= 2.0 ? "PASS" : "FAIL/WARN")}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No course outcomes logged for student portal.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: COURSE INSTRUCTORS */}
              {activeDashboardTab === "teachers" && (
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-lg">
                  <div className="mb-6">
                    <h3 className="text-md sm:text-lg font-bold font-serif text-white tracking-tight">Teaching Faculty Ledger</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Faculty members who conducted the courses you have completed
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {academicResults?.courses && academicResults.courses.length > 0 ? (
                      academicResults.courses.map((course: any, i: number) => (
                        <div key={i} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex gap-4 pr-6 relative overflow-hidden">
                          <div className="h-10 w-10 bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] bg-slate-950 px-2 py-0.5 text-amber-500 rounded border border-slate-850 font-mono inline-block mb-1">
                              {course.code}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-200">{course.teacher || "Assigned Faculty"}</h4>
                            <p className="text-xs text-slate-400 truncate max-w-[220px]">{course.title}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-slate-500 italic text-center py-10">No teacher assignments completed.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE INTEGRITY SETTINGS */}
              {activeDashboardTab === "settings" && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg max-w-2xl">
                  <h3 className="text-md sm:text-lg font-bold font-serif text-white tracking-tight mb-4">
                    Security Credentials & Profile Settings
                  </h3>

                  {profileMessage && (
                    <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-950 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>{profileMessage}</span>
                    </div>
                  )}
                  {profileError && (
                    <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span>
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          My Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          My Mobile Phone
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-6">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Change Security Password</h4>
                      <p className="text-[10px] text-slate-400 mb-4">Leave fields blank if you do not want to alter account logins.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            New Secure Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition uppercase tracking-wider cursor-pointer font-sans"
                      >
                        {profileLoading ? "Updating Portal Profile..." : "Apply Profile Modifications"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      <footer className="bg-slate-950 border-t border-slate-800/60 py-6 text-center text-slate-500 text-xs select-none">
        <p>© North East University Bangladesh. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-600">Archived grades portals synchronize dynamically with administration uploads.</p>
      </footer>
    </div>
  );
}
