import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  BookOpen, 
  Printer, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  AlertCircle, 
  Award, 
  GraduationCap,
  ChevronRight, 
  CheckCircle,
  FileText,
  X,
  Lock,
  Eye,
  EyeOff,
  Check
} from "lucide-react";

interface PublicPortalProps {
  onGoToAdmin: () => void;
  onGoToStudentPortal: () => void;
}

export default function PublicPortal({ onGoToAdmin, onGoToStudentPortal }: PublicPortalProps) {
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [passingYear, setPassingYear] = useState("");
  
  // Student Login & State Variables
  const [loggedInStudent, setLoggedInStudent] = useState<any | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Results view modal
  const [showResultPopup, setShowResultPopup] = useState(false);

  // Sync session on mount
  useEffect(() => {
    const saved = localStorage.getItem("neub_student_session");
    if (saved) {
      try {
        setLoggedInStudent(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("neub_student_session");
      }
    }
  }, []);
  
  // Math Captcha Setup (supporting multiplication matching the * operator in screenshot)
  const [captchaNum1, setCaptchaNum1] = useState(18);
  const [captchaNum2, setCaptchaNum2] = useState(13);
  const [captchaOperator, setCaptchaOperator] = useState<"+" | "*">("*");
  const [captchaAnswer, setCaptchaAnswer] = useState("234");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resultsData, setResultData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial dynamic captcha challenge
    generateCaptcha();
    fetchDepartments();
  }, []);

  const generateCaptcha = () => {
    // 70% chance of multiplication to show realistic math verification like the screenshot
    const isMultiplication = Math.random() > 0.3;
    const num1 = isMultiplication ? Math.floor(Math.random() * 12) + 7 : Math.floor(Math.random() * 40) + 10;
    const num2 = isMultiplication ? Math.floor(Math.random() * 11) + 3 : Math.floor(Math.random() * 40) + 10;
    
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaOperator(isMultiplication ? "*" : "+");
    setCaptchaAnswer(isMultiplication ? String(num1 * num2) : String(num1 + num2));
    setUserCaptcha("");
    setCaptchaError(false);
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartmentsList(data);
      }
    } catch (err) {
      console.error("Error loading departments", err);
    }
  };

  const handleClear = () => {
    setStudentId("");
    setDepartment("");
    setSemester("");
    setPassingYear("");
    setUserCaptcha("");
    setCaptchaError(false);
    setErrorMsg("");
    setResultData([]);
    setSearchTriggered(false);
    generateCaptcha();
  };

  const executeSearch = async () => {
    setErrorMsg("");
    setResultData([]);
    setLoading(true);
    setSearchTriggered(true);

    try {
      const url = `/api/search?student_id=${encodeURIComponent(studentId.trim())}` +
        (department ? `&department=${encodeURIComponent(department)}` : "") +
        (semester ? `&semester=${encodeURIComponent(semester)}` : "") +
        (passingYear ? `&passing_year=${encodeURIComponent(passingYear)}` : "");

      const res = await fetch(url);
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data && responseData.data.length > 0) {
          setResultData(responseData.data);
          setShowResultPopup(true);
        } else {
          setErrorMsg("No results found matching your query criteria. Please verify your Student ID and other details.");
        }
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to search results. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResultData([]);
    
    // Validate Captcha
    if (userCaptcha.trim() !== captchaAnswer) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }
    setCaptchaError(false);

    // Check if session exists in state or local storage
    const saved = localStorage.getItem("neub_student_session");
    if (!saved && !loggedInStudent) {
      setLoginUser(studentId.trim());
      setLoginPass("");
      setLoginErr("");
      setShowLoginPopup(true);
      return;
    }

    await executeSearch();
  };

  const handlePopupLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: loginUser.trim(),
          password: loginPass
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("neub_student_session", JSON.stringify(data.student));
        setLoggedInStudent(data.student);
        setShowLoginPopup(false);
        // Execute search immediately after successful authentication
        await executeSearch();
      } else {
        setLoginErr(data.message || "Incorrect Student ID or password.");
      }
    } catch (err) {
      setLoginErr("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Calculate Weighted GPA
  const calculateGPA = (courses: any[]) => {
    let totalPoints = 0;
    let totalCredits = 0;
    let completedCredits = 0;

    courses.forEach(c => {
      const credit = Number(c.credit) || 0;
      const gp = Number(c.points) || 0;
      if (c.grade && c.grade !== "F" && c.grade !== "I" && c.grade !== "W") {
        completedCredits += credit;
      }
      totalPoints += (gp * credit);
      totalCredits += credit;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    return {
      gpa: gpa.toFixed(2),
      totalCredits,
      completedCredits
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatedDownload = (studentName: string, id: string) => {
    const currentStudent = resultsData.find(s => s.student_id === id);
    if (!currentStudent) return;

    const summary = calculateGPA(currentStudent.courses);
    let content = `NORTH EAST UNIVERSITY BANGLADESH\n`;
    content += `Official Academic Result Record\n`;
    content += `==============================================\n`;
    content += `Student ID   : ${currentStudent.student_id}\n`;
    content += `Name         : ${currentStudent.student_name}\n`;
    content += `Dept Code    : ${currentStudent.department_code}\n`;
    content += `Semester     : ${currentStudent.semester} ${currentStudent.passing_year}\n`;
    content += `==============================================\n\n`;
    content += `Course Code | Course Title | Credit | Grade | Grade Point\n`;
    content += `-------------------------------------------------------\n`;
    
    currentStudent.courses.forEach((c: any) => {
      content += `${c.code.padEnd(11)} | ${c.title.padEnd(25)} | ${c.credit.padEnd(6)} | ${c.grade.padEnd(5)} | ${c.points}\n`;
    });

    content += `-------------------------------------------------------\n`;
    content += `Summary Stats:\n`;
    content += `Weighted Average GPA: ${summary.gpa}\n`;
    content += `Total Enrolled Credits: ${summary.totalCredits}\n`;
    content += `Completed Credits: ${summary.completedCredits}\n`;
    content += `\nGenerated on: ${new Date().toLocaleString()}\n`;
    content += `© North East University Bangladesh. For verification, contact Registrar.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Results_${id}_${currentStudent.semester}_${currentStudent.passing_year}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#dce5ec] text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Panel - EXACTLY MATCHING HIGHLIGHT LAYOUT */}
      <header className="bg-white text-slate-800 shadow-md no-print border-b-2 border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 select-none">
            {/* Blue NE Circular Badge */}
            <div className="h-16 w-16 bg-[#11355d] text-white rounded-full flex items-center justify-center font-bold text-2xl font-serif shadow-md border border-[#0d2847] shrink-0">
              NE
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">
                North East University Bangladesh
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Established in 1996 • NEUB • Sylhet, Bangladesh
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-md font-bold text-[#1a518cad]">
                <span>📋 Semester Result Portal - Spring-2025</span>
              </div>
            </div>
          </div>
          
          {/* Authentic Portal Switch buttons floating nicely */}
          <div className="flex flex-wrap items-center gap-2.5">
            {loggedInStudent && (
              <div className="flex items-center gap-2 select-none border border-emerald-300 bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                <span className="truncate max-w-[120px]" title={loggedInStudent.name}>
                  {loggedInStudent.student_id} ({loggedInStudent.name})
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem("neub_student_session");
                    setLoggedInStudent(null);
                  }}
                  className="text-rose-600 hover:text-rose-800 border-l border-slate-300 ml-2 pl-2 hover:underline cursor-pointer font-bold shrink-0"
                >
                  Logout
                </button>
              </div>
            )}
            <button
              onClick={onGoToStudentPortal}
              id="student-portal-btn"
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold rounded-lg text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Profile</span>
            </button>
            <button
              onClick={onGoToAdmin}
              id="admin-login-btn"
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1e293b] hover:bg-[#0f172a] text-[#facc15] font-bold rounded-lg text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Core Container with the EXACT CARD DESIGN FROM THE SCREENSHOT */}
      <main className="flex-grow max-w-[980px] mx-auto w-full px-4 py-8 sm:px-6 no-print">
        <div className="space-y-6">
          
          {/* Main White Search Form Card */}
          <div className="bg-white rounded-lg shadow-xl shadow-slate-300 border border-slate-200/90 p-6 sm:p-9">
            
            {/* Row: Search Result Header */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <div className="w-1.5 h-6 bg-[#1a4473] rounded-full"></div>
              <h2 className="text-lg font-bold text-[#154273] tracking-tight">
                Search Result
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="space-y-5">
              
              {/* Row Grid: 4 selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Field 1: Student ID Input */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., 200103020050"
                    id="student-id-input"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition shadow-sm"
                  />
                </div>

                {/* Field 2: Department Select */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    id="department-select"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-slate-800 text-[13px] focus:outline-none focus:border-[#38bdf8] transition shadow-sm cursor-pointer"
                  >
                    <option value="">-- Select Department --</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.code}>
                        {dept.code} ({dept.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Passing Year Select */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Passing Year *
                  </label>
                  <select
                    required
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                    id="year-select"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-slate-800 text-[13px] focus:outline-none focus:border-[#38bdf8] transition shadow-sm cursor-pointer"
                  >
                    <option value="">-- Select Year --</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                  </select>
                </div>

                {/* Field 4: Semester Select */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Semester *
                  </label>
                  <select
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    id="semester-select"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-slate-800 text-[13px] focus:outline-none focus:border-[#38bdf8] transition shadow-sm cursor-pointer"
                  >
                    <option value="">-- Select Semester --</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                </div>

              </div>

              {/* SECURITY VERIFICATION CONTAINER - EXACT SCRON */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded p-4.5 mt-5">
                <div className="text-[11px] font-bold text-slate-600 uppercase mb-3 tracking-wider flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>Security Verification</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  
                  {/* Left challenge visual box */}
                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between px-5 py-2 bg-white border border-slate-200 rounded-md shadow-inner text-center select-none">
                      <span className="text-[15px] font-black font-mono tracking-widest text-slate-700">
                        {captchaNum1} {captchaOperator === "*" ? "*" : "+"} {captchaNum2} = ?
                      </span>
                    </div>
                  </div>

                  {/* Right User Answer input inside same row */}
                  <div className="md:col-span-7 flex items-center gap-2">
                    <div className="flex-grow">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Answer *
                      </label>
                      <input
                        type="text"
                        required
                        value={userCaptcha}
                        onChange={(e) => setUserCaptcha(e.target.value)}
                        placeholder="Enter answer"
                        id="captcha-input"
                        className="w-full px-3 py-2 border bg-white border-slate-300 rounded text-slate-800 text-[13.5px] focus:outline-none focus:border-[#38bdf8] shadow-sm select-all"
                      />
                    </div>

                    {/* Refresh challenge trigger */}
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-2.5 mt-5 bg-[#e2e8f0] hover:bg-slate-300 border border-slate-300 hover:border-slate-400 rounded transition text-[#3b82f6] shadow-sm cursor-pointer shrink-0"
                      title="Regenerate Security math problem"
                    >
                      <RefreshCw className="h-4.5 w-4.5" />
                    </button>
                  </div>

                </div>

                {captchaError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-rose-600 font-bold text-xs mt-2.5 pl-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Calculated security verification is incorrect. Math key refreshed!</span>
                  </motion.div>
                )}
              </div>

              {/* Action query buttons - CENTER ALIGNED AS SCREENSHOT */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
                
                <button
                  type="submit"
                  disabled={loading}
                  id="results-search-btn"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold text-xs uppercase tracking-wider rounded border border-[#1b4372] hover:shadow-md transition cursor-pointer select-none disabled:opacity-75 shadow"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                      <span>Verifying Record...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-400 text-sm">🔍</span>
                      <span>Search Results</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2.5 bg-[#f1f5f9] hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer shadow-sm"
                >
                  Clear
                </button>

              </div>

            </form>

            {/* Sky blue help text container exact as screenshot */}
            <div className="bg-[#eef6fc] border-l-4 border-[#2563eb] text-[#1d4ed8] p-4 text-[12px] leading-relaxed rounded-md mt-6 flex items-start gap-2.5 shadow-sm">
              <span className="text-sm font-bold mt-[-1px]">ℹ</span>
              <p>
                Enter your Student ID, select Department, Passing Year and Semester, then complete the security verification to view your Academic Results.
              </p>
            </div>

            {/* Separator inside card */}
            <hr className="border-slate-100 my-6" />

            {/* Dedicated credit / footer metadata EXACT */}
            <div className="text-center text-slate-500 text-[11px] leading-relaxed select-none">
              <p>© 2026 North East University Bangladesh. All Rights Reserved.</p>
              <p className="mt-0.5 text-slate-400">
                Designed and Developed by <strong className="text-slate-500 font-semibold underline decoration-slate-200">Tirevol</strong>
              </p>
            </div>

          </div>

          {/* DYNAMIC RESULTS AND REPORT TRANSCRIPT DISPLAY */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow"
                >
                  <RefreshCw className="h-10 w-10 text-[#1b4372] animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-serif text-sm">
                    Querying campus transcripts and mapping semester metrics...
                  </p>
                </motion.div>
              )}

              {!loading && resultsData.length === 0 && searchTriggered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow"
                >
                  <div className="p-3 bg-rose-50 rounded-full text-rose-600 inline-block mb-3">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1.5">
                    No matching results
                  </h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    {errorMsg || "The selected parameters did not return any certified courses. Check student ID and correct semester details."}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* MODAL 1: STUDENT LOGIN POPUP TO SEARCH */}
      <AnimatePresence>
        {showLoginPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
            >
              {/* Header banner */}
              <div className="bg-[#11355d] text-white p-6 flex justify-between items-center bg-gradient-to-r from-[#11355d] to-[#122f51]">
                <div className="flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                  <h3 className="text-xs font-black tracking-wider text-white uppercase font-sans">
                    Authentication Required
                  </h3>
                </div>
                <button 
                  onClick={() => setShowLoginPopup(false)}
                  className="text-slate-300 hover:text-white cursor-pointer transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handlePopupLoginSubmit} className="p-6 space-y-4 font-sans bg-white text-left">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  You must be logged in as a student to view academic search results. Please authenticate below.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="e.g. 5624205101065"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#3a82f6] focus:ring-1 focus:ring-[#3a82f6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#3a82f6] focus:ring-1 focus:ring-[#3a82f6]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <span className="block text-[9.5px] text-slate-400 mt-1.5 font-medium leading-normal">
                    📌 Note: New student account? Default password is <strong className="text-amber-500 font-extrabold select-all">DefaultP12!</strong>
                  </span>
                </div>

                {loginErr && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[#b91c1c] text-[11px] flex gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{loginErr}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLoginPopup(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="px-5 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer shadow transition flex items-center justify-center gap-1.5 min-w-[140px]"
                  >
                    {loginLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <span>Login & Search</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SEARCH RESULTS OVERLAY POPUP */}
      <AnimatePresence>
        {showResultPopup && resultsData.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-8 text-left"
            >
              {/* Header actions block */}
              <div className="bg-[#11355d] text-white p-4 px-6 flex justify-between items-center bg-gradient-to-r from-[#11355d] to-[#122f51] border-b border-rose-100 no-print">
                <span className="text-xs font-black tracking-wider uppercase font-sans text-amber-400">
                  Academic Record Found
                </span>
                <button 
                  onClick={() => setShowResultPopup(false)}
                  className="text-slate-300 hover:text-white bg-slate-800/40 p-1.5 rounded-full cursor-pointer transition shrink-0"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable contents wrapper */}
              <div className="max-h-[75vh] overflow-y-auto">
                {resultsData.map((stdGroup) => {
                  const stats = calculateGPA(stdGroup.courses);
                  return (
                    <div key={stdGroup.student_id} className="space-y-0">
                      
                      {/* Printable Area Transcript Wrapper */}
                      <div id="print-area">
                        
                        {/* Transcript Header banner */}
                        <div className="bg-[#1b4372] text-white p-6 border-b-4 border-amber-400">
                          <div className="text-xs uppercase font-bold tracking-widest text-slate-300">
                            North East University Bangladesh
                          </div>
                          <h3 className="text-lg sm:text-2xl font-bold font-serif text-amber-300 mt-1">
                            Semester Transcript
                          </h3>
                          <p className="text-slate-200 text-xs mt-1.5">
                            Semester Session: <span className="font-semibold text-white">{stdGroup.semester} {stdGroup.passing_year}</span>
                          </p>
                        </div>

                        {/* Detail fields */}
                        <div className="p-6 bg-[#f8fafc] border-b border-slate-100 flex flex-wrap gap-x-8 gap-y-4">
                          <div className="min-w-[200px]">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Student Name</span>
                            <span className="text-sm font-bold text-[#1b4372]">{stdGroup.student_name}</span>
                          </div>
                          <div className="min-w-[140px]">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Student ID</span>
                            <span className="text-sm font-mono font-bold text-slate-800">{stdGroup.student_id}</span>
                          </div>
                          <div className="min-w-[140px]">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Department</span>
                            <span className="text-sm font-semibold text-slate-700">{stdGroup.department_code}</span>
                          </div>
                          <div className="min-w-[140px]">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Date Issued</span>
                            <span className="text-xs font-mono text-slate-500">
                              {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Table with columns */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase text-slate-500">Course Code</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase text-slate-500">Course Title</th>
                                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase text-slate-500">Credit Hour</th>
                                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase text-slate-500">Instructor</th>
                                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase text-slate-500">Letter Grade</th>
                                <th className="px-5 py-3 text-center text-[11px] font-bold uppercase text-slate-500">Grade Point</th>
                                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase text-slate-500">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                              {stdGroup.courses.map((course: any, cIdx: number) => (
                                <tr key={cIdx} className="hover:bg-slate-50/50 transition">
                                  <td className="px-5 py-3 font-mono text-xs font-bold text-[#1b4372]">{course.code}</td>
                                  <td className="px-5 py-3 text-xs sm:text-xs font-bold text-slate-700">{course.title}</td>
                                  <td className="px-5 py-3 text-center text-xs font-semibold text-slate-600">{course.credit} CH</td>
                                  <td className="px-5 py-3 text-center text-xs text-slate-500 truncate max-w-[140px]" title={course.teacher}>{course.teacher || "Assigned Faculty"}</td>
                                  <td className="px-5 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 font-bold font-mono text-[10px] rounded ${
                                      course.grade.startsWith("A") ? "bg-emerald-100 text-emerald-800" :
                                      course.grade.startsWith("B") ? "bg-sky-100 text-sky-800" :
                                      course.grade.startsWith("C") ? "bg-amber-100 text-amber-800" :
                                      course.grade.startsWith("D") ? "bg-orange-100 text-orange-800" :
                                      "bg-rose-100 text-rose-800"
                                    }`}>
                                      {course.grade}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-center font-mono text-xs font-bold text-slate-700">{course.points}</td>
                                  <td className="px-5 py-3 text-xs text-slate-400 font-mono">{course.remarks || "PASS"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary aggregate info strip */}
                        <div className="p-5.5 bg-[#122f51] text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-amber-500 text-slate-900 rounded-lg text-sm">💡</span>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Total GPA Performance</span>
                              <span className="text-md sm:text-lg font-bold text-amber-400 font-mono">
                                {stats.gpa} / 4.00
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-4 border-l-0 sm:border-l border-slate-700 pl-0 sm:pl-4 text-xs font-semibold font-mono">
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-slate-400">Enrolled CH</span>
                              <span>{stats.totalCredits} CH</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-slate-400">Completed CH</span>
                              <span className="text-emerald-400">{stats.completedCredits} CH</span>
                            </div>
                          </div>
                        </div>

                        {/* Print layout terms */}
                        <div className="hidden print:block mt-8 text-center border-t border-dashed border-slate-300 pt-6 text-[10px] text-slate-400">
                          <p>Certified digital transmission record verified under NEUB academic guidelines.</p>
                          <p className="mt-1">© {new Date().getFullYear()} North East University Bangladesh. Signature: Online Verified.</p>
                        </div>

                      </div>

                      {/* Action Options below */}
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 no-print">
                        <button
                          onClick={() => handlePrint()}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer select-none"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print Transcript</span>
                        </button>
                        <button
                          onClick={() => handleSimulatedDownload(stdGroup.student_name, stdGroup.student_id)}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl transition shadow cursor-pointer select-none"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Text Summary</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResultPopup(false)}
                          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Close Details
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Muted baseline footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-5 text-xs text-center select-none no-print">
        <p>© {new Date().getFullYear()} North East University Bangladesh. All Rights Reserved.</p>
        <p className="text-[10px] text-slate-600 mt-1">
          Developed in accordance with NEUB result publishing guidelines.
        </p>
      </footer>

    </div>
  );
}
