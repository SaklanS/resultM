import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart2, 
  Users, 
  BookOpen, 
  Clipboard, 
  UploadCloud, 
  Grid, 
  Shield, 
  LogOut, 
  Lock, 
  Building, 
  FileText,
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  ArrowRight,
  Database,
  History,
  Activity,
  Filter,
  Award,
  CheckCircle
} from "lucide-react";

interface AdminPortalProps {
  onLogout: () => void;
}

export default function AdminPortal({ onLogout }: AdminPortalProps) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  
  // Login Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // General States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemStats, setSystemStats] = useState({
    students: 0,
    courses: 0,
    results: 0,
    departments: 0,
    logs: 0
  });

  // DB States
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  // Modals & CRUD UI Forms
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<number | null>(null);
  
  // Student Modal Form States
  const [formStdId, setFormStdId] = useState("");
  const [formStdName, setFormStdName] = useState("");
  const [formStdEmail, setFormStdEmail] = useState("");
  const [formStdDept, setFormStdDept] = useState("");
  const [isDuplicateStd, setIsDuplicateStd] = useState(false);
  const [duplicateWarningMsg, setDuplicateWarningMsg] = useState("");

  // Course Form States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [formCourseCode, setFormCourseCode] = useState("");
  const [formCourseTitle, setFormCourseTitle] = useState("");
  const [formCourseCredit, setFormCourseCredit] = useState(3);
  const [formCourseEcr, setFormCourseEcr] = useState(3);
  const [formCourseTeacher, setFormCourseTeacher] = useState("");

  // Settings states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // DB Reset
  const [showResetModal, setShowResetModal] = useState(false);

  // Dynamic Query Filter states
  const [filterSemester, setFilterSemester] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [filteredStats, setFilteredStats] = useState<any | null>(null);
  const [filterQueryTriggered, setFilterQueryTriggered] = useState(false);

  // CSV Uploader States (Auto-Create & Smart Update)
  const [uploaderFile, setUploaderFile] = useState<File | null>(null);
  const [uploaderSemester, setUploaderSemester] = useState("Spring");
  const [uploaderYear, setUploaderYear] = useState(new Date().getFullYear());
  const [uploaderDept, setUploaderDept] = useState("");
  const [uploaderKeyField, setUploaderKeyField] = useState("id");
  const [uploaderNameCol, setUploaderNameCol] = useState("");
  const [uploaderUploadSuccess, setUploaderUploadSuccess] = useState<any | null>(null);
  const [uploaderUploadError, setUploaderUploadError] = useState("");
  const [uploaderProcessing, setUploaderProcessing] = useState(false);

  // CSV Columns Mapper Step-by-Step
  const [mapperStep, setMapperStep] = useState(1);
  const [mapperFile, setMapperFile] = useState<File | null>(null);
  const [mapperCsvText, setMapperCsvText] = useState("");
  const [mapperHeaders, setMapperCsvHeaders] = useState<string[]>([]);
  const [mapperPreviewRows, setMapperCsvPreview] = useState<string[][]>([]);
  const [mapperSelections, setMapperSelections] = useState({
    studentId: "",
    name: "",
    email: "",
    courseCode: "",
    courseTitle: "",
    credit: "",
    ecr: "",
    grade: "",
    point: "",
    remarks: ""
  });
  const [mapperSemester, setMapperSemester] = useState("Spring");
  const [mapperYear, setMapperYear] = useState(new Date().getFullYear());
  const [mapperDeptId, setMapperDeptId] = useState("");
  const [mapperImportSuccess, setMapperImportSuccess] = useState<any | null>(null);
  const [mapperImportError, setMapperImportError] = useState("");
  const [mapperProcessing, setMapperProcessing] = useState(false);

  // New States for Sidebar Tab Navigation Alignments
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsCourseFilter, setResultsCourseFilter] = useState("");
  const [resultsGradeFilter, setResultsGradeFilter] = useState("");
  const [resultsPage, setResultsPage] = useState(1);
  const [showResultModal, setShowResultModal] = useState(false);
  const [formResStudentId, setFormResStudentId] = useState("");
  const [formResCourseId, setFormResCourseId] = useState("");
  const [formResGrade, setFormResGrade] = useState("A+");
  const [formResPoint, setFormResPoint] = useState(4.00);
  const [formResSemester, setFormResSemester] = useState("Spring");
  const [formResYear, setFormResYear] = useState(new Date().getFullYear());
  const [formResRemarks, setFormResRemarks] = useState("");
  const [resultsError, setResultsError] = useState("");
  const [resultsSuccess, setResultsSuccess] = useState("");

  const [formResMark, setFormResMark] = useState<number | "">("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  const mapMarkToGradeAndPoint = (mark: number) => {
    if (mark >= 80) return { grade: "A+", point: 4.00 };
    if (mark >= 75) return { grade: "A", point: 3.75 };
    if (mark >= 70) return { grade: "A-", point: 3.50 };
    if (mark >= 65) return { grade: "B+", point: 3.25 };
    if (mark >= 60) return { grade: "B", point: 3.00 };
    if (mark >= 55) return { grade: "B-", point: 2.75 };
    if (mark >= 50) return { grade: "C+", point: 2.50 };
    if (mark >= 45) return { grade: "C", point: 2.25 };
    if (mark >= 40) return { grade: "D", point: 2.00 };
    return { grade: "F", point: 0.00 };
  };

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [formDeptCode, setFormDeptCode] = useState("");
  const [formDeptName, setFormDeptName] = useState("");
  const [deptError, setDeptError] = useState("");
  const [deptSuccess, setDeptSuccess] = useState("");

  const autoMapGradeToPoints = (g: string) => {
    switch (g) {
      case "A+": return 4.00;
      case "A": return 3.75;
      case "A-": return 3.50;
      case "B+": return 3.25;
      case "B": return 3.00;
      case "B-": return 2.75;
      case "C+": return 2.50;
      case "C": return 2.25;
      case "D": return 2.00;
      case "F": return 0.00;
      default: return 4.00;
    }
  };

  useEffect(() => {
    setFormResPoint(autoMapGradeToPoints(formResGrade));
  }, [formResGrade]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Real-time duplicates checking on student_id/email
  useEffect(() => {
    if (formStdId && activeTab === "students") {
      const matchId = students.find(s => s.student_id === formStdId.trim() && s.id !== editingStudent?.id);
      if (matchId) {
        setIsDuplicateStd(true);
        setDuplicateWarningMsg(`⚠ Student already exists with ID '${formStdId}'. Submitting will update existing records.`);
      } else {
        const matchEmail = students.find(s => s.email && s.email.toLowerCase() === formStdEmail.trim().toLowerCase() && s.id !== editingStudent?.id);
        if (matchEmail) {
          setIsDuplicateStd(true);
          setDuplicateWarningMsg(`⚠ Email address already taken. Submitting will update existing records.`);
        } else {
          setIsDuplicateStd(false);
          setDuplicateWarningMsg("");
        }
      }
    } else {
      setIsDuplicateStd(false);
      setDuplicateWarningMsg("");
    }
  }, [formStdId, formStdEmail]);

  const loadAllData = async () => {
    try {
      const [resDepts, resStds, resCourses, resResults, resLogs, resSysLogs] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/students"),
        fetch("/api/courses"),
        fetch("/api/results"),
        fetch("/api/upload-logs"),
        fetch("/api/logs")
      ]);

      if (resDepts.ok && resStds.ok && resCourses.ok && resResults.ok && resLogs.ok && resSysLogs.ok) {
        const depts = await resDepts.json();
        const stds = await resStds.json();
        const courses = await resCourses.json();
        const resultsData = await resResults.json();
        const uploads = await resLogs.json();
        const sysLogs = await resSysLogs.json();

        setDepartments(depts);
        setStudents(stds);
        setCourses(courses);
        setResults(resultsData);
        setUploadLogs(uploads);
        setSystemLogs(sysLogs.system_logs || []);

        setSystemStats({
          students: stds.length,
          courses: courses.length,
          results: resultsData.length,
          departments: depts.length,
          logs: sysLogs.system_logs?.length || 0
        });

        // Initialize missing defaults for uploader
        if (depts.length > 0) {
          setUploaderDept(String(depts[0].id));
          setMapperDeptId(String(depts[0].id));
          setFormStdDept(String(depts[0].id));
        }
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("admin_token", data.username);
        setToken(data.username);
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.message || "Invalid credentials. Please verify username and password.");
      }
    } catch (err) {
      setLoginError("Server communication failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    onLogout();
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: formStdId,
        name: formStdName,
        email: formStdEmail || `${formStdId.toLowerCase()}@neub.edu.bd`,
        department_id: Number(formStdDept)
      };

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowStudentModal(false);
        loadAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save student.");
      }
    } catch (err) {
      alert("Error saving record.");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowConfirmDeleteId(null);
        loadAllData();
      } else {
        alert("Failed to delete record.");
      }
    } catch (err) {
      alert("Error executing delete.");
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formCourseCode,
        title: formCourseTitle,
        credit: formCourseCredit,
        ecr: formCourseEcr,
        teacher: formCourseTeacher
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCourseModal(false);
        loadAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Error saving course.");
      }
    } catch (err) {
      alert("Error.");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (confirm("Are you sure you want to delete this course? Deleting a course will cascade deleted results associated with it.")) {
      try {
        const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        alert("Error executing delete.");
      }
    }
  };

  // Results Manual Saving CRUD
  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultsError("");
    setResultsSuccess("");
    if (!formResStudentId || !formResCourseId || !formResGrade) {
      setResultsError("Please fill out all required fields.");
      return;
    }
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id_val: formResStudentId,
          course_id_val: formResCourseId,
          letter_grade: formResGrade,
          grade_point: Number(formResPoint),
          remarks: formResRemarks,
          semester: formResSemester,
          passing_year: Number(formResYear)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResultsSuccess(data.message || "Grade result entry saved successfully!");
        setFormResStudentId("");
        setFormResCourseId("");
        setFormResRemarks("");
        setTimeout(() => {
          setShowResultModal(false);
          setResultsSuccess("");
          loadAllData();
        }, 1200);
      } else {
        setResultsError(data.message || "Failed to save result.");
      }
    } catch (err) {
      setResultsError("Server communication error.");
    }
  };

  const handleDeleteResult = async (id: number) => {
    if (!confirm("Are you absolutely sure you want to delete this grade result record?")) return;
    try {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadAllData();
      } else {
        alert("Failed to delete result record.");
      }
    } catch (err) {
      alert("Error connection.");
    }
  };

  // Departments CRUD
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError("");
    setDeptSuccess("");
    if (!formDeptCode || !formDeptName) {
      setDeptError("Department code and name are required.");
      return;
    }
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formDeptCode, name: formDeptName })
      });
      const data = await res.json();
      if (res.ok) {
        setDeptSuccess(data.message || "Department created successfully!");
        setFormDeptCode("");
        setFormDeptName("");
        setTimeout(() => {
          setShowDeptModal(false);
          setDeptSuccess("");
          loadAllData();
        }, 1200);
      } else {
        setDeptError(data.message || "Failed to save department.");
      }
    } catch (err) {
      setDeptError("Server communication failed.");
    }
  };

  // Dynamic Browser-side Backup export
  const handleExportBackup = () => {
    const backupObj = {
      exportedAt: new Date().toISOString(),
      system: "NEUB Grading System Admin Db Dump",
      departments,
      students,
      courses,
      results,
      systemLogs
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEUB_Database_Backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyQueryFilter = () => {
    setFilterQueryTriggered(true);
    let temp = [...results];

    if (filterSemester) {
      temp = temp.filter(r => r.semester.toUpperCase() === filterSemester.toUpperCase());
    }
    if (filterYear) {
      temp = temp.filter(r => String(r.passing_year) === filterYear.trim());
    }

    setFilteredResults(temp);

    // Calculate aggregated stats
    if (temp.length > 0) {
      const uniqueStds = new Set(temp.map(r => r.student_id)).size;
      const uniqueCourses = new Set(temp.map(r => r.course_id)).size;
      
      let sumOfGradePoints = 0;
      let totalAssignedPoints = 0;
      temp.forEach(r => {
        if (r.grade_point !== null) {
          sumOfGradePoints += r.grade_point;
          totalAssignedPoints++;
        }
      });
      const avgGPA = totalAssignedPoints > 0 ? (sumOfGradePoints / totalAssignedPoints).toFixed(2) : "0.00";

      setFilteredStats({
        resultsCount: temp.length,
        uniqueStudents: uniqueStds,
        uniqueCourses: uniqueCourses,
        avgGPA
      });
    } else {
      setFilteredStats(null);
    }
  };

  // CSV reader handler for Direct Intelligent Uploader
  const handleCSVUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderFile) {
      setUploaderUploadError("Please select a valid CSV file first.");
      return;
    }

    setUploaderUploadError("");
    setUploaderUploadSuccess(null);
    setUploaderProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await fetch("/api/results/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csvText: text,
            semester: uploaderSemester,
            year: Number(uploaderYear),
            departmentId: uploaderDept,
            keyField: uploaderKeyField,
            originalFilename: uploaderFile.name,
            username: token
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUploaderUploadSuccess(data);
          setUploaderFile(null);
          loadAllData();
        } else {
          setUploaderUploadError(data.message || "Failed to process results import. Inspect headers.");
        }
      } catch (err) {
        setUploaderUploadError("Communication failure during csv parsing.");
      } finally {
        setUploaderProcessing(false);
      }
    };

    reader.readAsText(uploaderFile);
  };

  // CSV columns mapper parser step-by-step logic
  const handleMapperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMapperFile(file);
    setMapperImportError("");
    setMapperImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMapperCsvText(text);

      const parsedLines = parseCSV(text);
      if (parsedLines.length > 0) {
        const headers = parsedLines[0];
        setMapperCsvHeaders(headers);
        setMapperCsvPreview(parsedLines.slice(1, 6)); // Preview first 5 rows

        // Auto guessing mappings where possible
        const guessed = { ...mapperSelections };
        headers.forEach(h => {
          const l = h.toLowerCase().trim();
          if (l === "id" || l === "student_id" || l === "studentid" || l.includes("student id")) guessed.studentId = h;
          if (l === "name" || l === "studentname" || l === "fullname" || l.includes("student name") || l === "student_name") guessed.name = h;
          if (l === "email" || l === "student_email") guessed.email = h;
          if (l === "course" || l === "coursecode" || l === "course_code" || l === "code") guessed.courseCode = h;
          if (l === "coursetitle" || l === "course_title" || l === "title" || l.includes("course title")) guessed.courseTitle = h;
          if (l === "credit" || l === "credits") guessed.credit = h;
          if (l === "ecr" || l === "effective") guessed.ecr = h;
          if (l === "grade" || l === "lettergrade" || l === "letter_grade" || l.includes("letter grade")) guessed.grade = h;
          if (l === "point" || l === "gradepoint" || l === "grade_point" || l === "gpa" || l === "gp") guessed.point = h;
          if (l === "remarks" || l === "remark") guessed.remarks = h;
        });
        setMapperSelections(guessed);
        setMapperStep(2); // Progress to preview & columns mapping screen
      } else {
        setMapperImportError("Selected file is blank/unreadable.");
      }
    };
    reader.readAsText(file);
  };

  const handleMapperImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapperCsvText) return;

    // Validate Minimum Mapper requirements (studentId, name, courseCode are required)
    if (!mapperSelections.studentId || !mapperSelections.name || !mapperSelections.courseCode) {
      setMapperImportError("StudentID config, Student Name config, and Course Code config must be mapped for importing.");
      return;
    }

    setMapperImportError("");
    setMapperImportSuccess(null);
    setMapperProcessing(true);

    try {
      const res = await fetch("/api/results/map-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText: mapperCsvText,
          mapping: mapperSelections,
          semester: mapperSemester,
          year: Number(mapperYear),
          departmentId: mapperDeptId,
          originalFilename: mapperFile?.name,
          username: token
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMapperImportSuccess(data);
        // Clear
        setMapperFile(null);
        setMapperCsvText("");
        setMapperStep(1);
        loadAllData();
      } else {
        setMapperImportError(data.message || "Flexible Columns import mapping failed.");
      }
    } catch (err) {
      setMapperImportError("Server connection error during Mapped Import.");
    } finally {
      setMapperProcessing(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      const res = await fetch("/api/admin/clear-database", { method: "POST" });
      if (res.ok) {
        setShowResetModal(false);
        loadAllData();
        alert("Configuration reset - all transactional records cleaned.");
      }
    } catch (e) {
      alert("Failed reset.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    setSettingsError("");

    if (newPassword !== newPasswordConfirm) {
      setSettingsError("New password verification does not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: token,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess("✓ Admin Credentials secure - password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
      } else {
        setSettingsError(data.message || "Failed password update.");
      }
    } catch (e) {
      setSettingsError("Server communication error.");
    }
  };

  // Helper row parser inside script
  function parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines.map(r => r.map(c => c.trim()));
  }

  // --- RENDER LOGIN FORM IN ABSENCE OF TOKEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-[#dce5ec] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl shadow-slate-300 max-w-md w-full overflow-hidden border border-slate-200"
        >
          <div className="bg-[#11355d] text-white p-8 text-center border-b-4 border-[#f59e0b]">
            <div className="p-3.5 bg-[#f59e0b] rounded-2xl text-white inline-block mb-3 shadow border border-[#d97706]">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">NEUB Control Panel</h2>
            <p className="text-[#a5f3fc]/80 text-[10px] mt-1.5 uppercase font-bold tracking-widest">
              Authorized Administrative Access
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. saklan"
                  id="admin-username-input"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  id="admin-password-input"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all shadow-sm"
                />
              </div>

              {loginError && (
                <div id="login-error-msg" className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                id="login-submit-btn"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#11355d] hover:bg-[#0d2847] text-white font-bold rounded-xl shadow-sm transition-all focus:outline-none cursor-pointer text-sm"
              >
                {loginLoading ? <RefreshCw className="h-4 w-4 animate-spin text-amber-300" /> : null}
                <span>Verify Credentials</span>
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-[11px] text-slate-400">
              <span>Defaults: <strong className="text-slate-500 font-mono">saklan / Help2025@</strong></span>
              <button 
                onClick={onLogout}
                className="text-[#1a518c] hover:text-[#11355d] font-bold uppercase tracking-wide cursor-pointer text-[10px]"
              >
                ← Back to Portal
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Filtered Students Page Pagination calculation
  const filteredStudents = students.filter(s => {
    const query = studentSearch.toLowerCase().trim();
    const matchQuery = s.student_id.toLowerCase().includes(query) || 
                       s.name.toLowerCase().includes(query) || 
                       s.email.toLowerCase().includes(query);
    const matchDept = studentDeptFilter ? s.department_id === Number(studentDeptFilter) : true;
    return matchQuery && matchDept;
  });

  const studentsPerPage = 10;
  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);

  // Results calculation
  const filteredResultsAll = results.filter(r => {
    const query = resultsSearch.toLowerCase().trim();
    const matchQuery = !query ? true : (
      (r.student_id_code || "").toLowerCase().includes(query) ||
      (r.student_name || "").toLowerCase().includes(query) ||
      (r.course_code || "").toLowerCase().includes(query) ||
      (r.course_title || "").toLowerCase().includes(query)
    );
    const matchCourse = resultsCourseFilter ? r.course_id === Number(resultsCourseFilter) : true;
    const matchGrade = resultsGradeFilter ? r.letter_grade === resultsGradeFilter : true;
    return matchQuery && matchCourse && matchGrade;
  });

  const resultsPerPage = 10;
  const totalResultsPages = Math.ceil(filteredResultsAll.length / resultsPerPage) || 1;
  const paginatedResultsAll = filteredResultsAll.slice((resultsPage - 1) * resultsPerPage, resultsPage * resultsPerPage);

  const getDeptCodeById = (id: number) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.code : "N/A";
  };

  return (
    <div className="min-h-screen bg-[#dce5ec] text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Panel Navigation */}
      <aside className="w-full md:w-64 bg-[#11355d] border-r border-[#0d2847] shrink-0 flex flex-col select-none">
        
        {/* Branding branding */}
        <div className="p-6 border-b border-[#0d2847] flex items-center gap-3">
          <div className="h-10 w-10 bg-white text-[#11355d] rounded-full flex items-center justify-center font-bold text-lg font-serif shadow-md shrink-0 select-none border border-slate-100">
            NE
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-sans">NEUB Admin Portal</h2>
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">authenticated mode</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-grow overflow-y-auto max-h-[calc(100vh-160px)] p-4 pr-2 space-y-5 select-none scrollbar-thin">
          {[
            {
              title: "CORE MANAGEMENT",
              items: [
                { id: "dashboard", label: "Dashboard", icon: BarChart2 },
                { id: "students", label: "Students", icon: Users },
                { id: "courses", label: "Courses", icon: BookOpen },
                { id: "results", label: "Results", icon: Award },
                { id: "filter", label: "Filter Results", icon: Search },
                { id: "departments", label: "Departments", icon: Building }
              ]
            },
            {
              title: "DATA MANAGEMENT",
              items: [
                { id: "mapper", label: "CSV Field Mapper", icon: Grid },
                { id: "upload", label: "Upload CSV", icon: UploadCloud },
                { id: "reports", label: "Reports", icon: FileText },
                { id: "backup", label: "Backup", icon: Database }
              ]
            },
            {
              title: "SYSTEM",
              items: [
                { id: "logs", label: "Activity Logs", icon: Activity },
                { id: "settings", label: "Settings", icon: Lock }
              ]
            }
          ].map(section => (
            <div key={section.title} className="space-y-1.5" id={`sidebar-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="block text-[10px] font-bold text-blue-200/50 uppercase tracking-widest px-3 mb-1 font-sans">
                {section.title}
              </span>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-btn-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setUploaderUploadSuccess(null);
                        setMapperImportSuccess(null);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                        active
                          ? "bg-[#f59e0b] text-white font-bold shadow-md"
                          : "text-slate-300 hover:bg-[#1a4473] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Bottom Action user */}
        <div className="p-4 border-t border-[#0d2847] bg-[#0d2847]/40">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-300">
            <span>Verified Admin: <strong className="text-white">{token}</strong></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onLogout(); }}
              className="flex-1 px-3 py-2 border border-slate-500/25 hover:bg-[#1a4473]/50 text-xs font-bold rounded-lg text-center text-slate-200 cursor-pointer transition"
            >
              Public Hub
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-3 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-100 rounded-lg transition text-xs font-bold flex items-center justify-center cursor-pointer"
              title="Logout Credentials"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Container Panel */}
      <main className="flex-grow p-6 sm:p-8 flex flex-col gap-6 max-h-screen overflow-y-auto">
        
        {/* Dynamic Route Rendering based on activeTab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            
            {/* HUB TAB SCREEN */}
            {activeTab === "dashboard" && (
              <>
                {/* Hub Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Administrative Control Center</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Database monitoring, dynamic logs, and aggregate metrics</p>
                  </div>
                  <button
                    onClick={loadAllData}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-slate-700 hover:text-slate-900 transition cursor-pointer"
                    title="Reload data"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>

                {/* Aggregate Statistics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Total Students", val: systemStats.students, color: "from-sky-500 to-sky-600", icon: Users },
                    { label: "Syllabus Courses", val: systemStats.courses, color: "from-indigo-500 to-indigo-600", icon: BookOpen },
                    { label: "Grade Results", val: systemStats.results, color: "from-emerald-500 to-emerald-600", icon: Award },
                    { label: "Departments", val: systemStats.departments, color: "from-purple-500 to-purple-600", icon: Building },
                    { label: "Activity Logs", val: systemStats.logs, color: "from-amber-500 to-amber-600", icon: Activity }
                  ].map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-slate-200/50">
                        <div>
                          <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{card.label}</span>
                          <span className="text-2xl font-black font-mono text-[#11355d]">{card.val}</span>
                        </div>
                        <div className={`p-2 bg-gradient-to-br ${card.color} rounded-xl text-white shadow`}>
                          <CardIcon className="h-5 w-5" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upload Logs History for 7 weeks */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-[#f59e0b]" />
                      <h3 className="text-base font-bold text-[#154273] font-sans">Upload Activity Tracker (Last 7 Weeks)</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Self-reporting history</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-[#11355d]/10 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Original File Name</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Session</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Import Counts</th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Uploaded By</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Date Logged</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                        {uploadLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic text-sm bg-white">
                              No result CSV files uploaded yet.
                            </td>
                          </tr>
                        ) : (
                          uploadLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition bg-white">
                              <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate text-[#1a518c] font-bold" title={log.filename}>
                                {log.filename}
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                <span>{log.department}</span> - {log.semester} {log.year}
                              </td>
                              <td className="px-4 py-3 text-xs text-center font-medium">
                                Students: <span className="text-emerald-600 font-bold">{log.students_imported}</span> | 
                                Courses: <span className="text-indigo-600 font-bold">{log.courses_imported}</span> | 
                                Results: <span className="text-sky-600 font-bold">{log.results_imported}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  log.status === "completed" ? "bg-emerald-50 text-emerald-800 border border-emerald-205" :
                                  log.status === "completed_with_errors" ? "bg-amber-50 text-amber-800 border border-amber-205" :
                                  "bg-rose-50 text-rose-800 border border-rose-25"
                                }`}>
                                  {log.status === "completed" ? "Completed ✓" : log.status === "completed_with_errors" ? "Warnings ⚠️" : "Failed ✗"}
                                </span>
                                {log.error_message && (
                                  <span className="block text-[9px] text-rose-500 truncate max-w-[150px] mx-auto mt-1" title={log.error_message}>
                                    {log.error_message}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-slate-500 font-bold">{log.uploaded_by}</td>
                              <td className="px-4 py-3 text-xs text-slate-400 font-medium">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System DB Status Details Panel */}
                <div className="bg-gradient-to-r from-[#11355d] to-[#122f51] border border-[#0d2847] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-slate-200/50">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 bg-white/10 border border-white/10 rounded-2xl text-amber-300 shadow">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">Seeded Database Engine Information</h4>
                      <p className="text-xs text-slate-200 leading-normal max-w-xl">
                        This upgrade hosts a self-repairing local JSON relational simulator matching target production formats. Includes atomic constraints and clean rollback state handlers.
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow uppercase tracking-wider"
                    >
                      Reset Transaction History
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* RESULTS MANAGE SCREEN */}
            {activeTab === "results" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Student Result Grades</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Add, review, and delete individual course grade assignments</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormResStudentId("");
                      setFormResCourseId("");
                      setFormResGrade("A+");
                      setFormResPoint(4.00);
                      setFormResRemarks("");
                      setFormResMark("");
                      setStudentSearchQuery("");
                      setIsStudentDropdownOpen(false);
                      setCourseSearchQuery("");
                      setIsCourseDropdownOpen(false);
                      setResultsError("");
                      setResultsSuccess("");
                      setShowResultModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Assign Grade</span>
                  </button>
                </div>

                {/* Filter and search results bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center shadow-md shadow-slate-200/55">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={resultsSearch}
                      onChange={(e) => { setResultsSearch(e.target.value); setResultsPage(1); }}
                      placeholder="Search results code, name, course code..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <select
                      value={resultsCourseFilter}
                      onChange={(e) => { setResultsCourseFilter(e.target.value); setResultsPage(1); }}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.code}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-48">
                    <select
                      value={resultsGradeFilter}
                      onChange={(e) => { setResultsGradeFilter(e.target.value); setResultsPage(1); }}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
                    >
                      <option value="">All Grades</option>
                      {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results Registry Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-[#11355d]/10 text-slate-700 font-bold">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Course</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Grade</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Grade Point</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Semester</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {paginatedResultsAll.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                              No result grade entries matched your filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedResultsAll.map(result => (
                            <tr key={result.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 font-mono font-bold text-[#1a518c]">{result.student_id_code}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{result.student_name}</td>
                              <td className="px-6 py-4">
                                <div className="font-mono font-bold text-xs text-slate-700">{result.course_code}</div>
                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]" title={result.course_title}>{result.course_title}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold border border-emerald-250 font-mono text-xs">
                                  {result.letter_grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">{result.grade_point?.toFixed(2)}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500">{result.semester} {result.passing_year}</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDeleteResult(result.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 cursor-pointer transition"
                                  title="Remove Result Grade"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control footer bar */}
                  {totalResultsPages > 1 && (
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-150 text-xs text-slate-500">
                      <span className="font-semibold text-slate-500">
                        Page {resultsPage} of {totalResultsPages} (total {filteredResultsAll.length} entries matching)
                      </span>
                      <div className="inline-flex gap-2">
                        <button
                          disabled={resultsPage === 1}
                          onClick={() => setResultsPage(resultsPage - 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded font-bold cursor-pointer transition"
                        >
                          Prev
                        </button>
                        <button
                          disabled={resultsPage === totalResultsPages}
                          onClick={() => setResultsPage(resultsPage + 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded font-bold cursor-pointer transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FILTER RESULTS SCREEN */}
            {activeTab === "filter" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Performance Queries & Filters</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Query aggregate grading profiles by semesters, years, and student subsets</p>
                </div>

                {/* Dashboard results query filter */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                    <Filter className="h-5 w-5 text-[#f59e0b]" />
                    <h3 className="text-base font-bold text-[#154273] font-sans">Quick Performance Queries</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Filter Semester</label>
                      <select
                        value={filterSemester}
                        onChange={(e) => setFilterSemester(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                      >
                        <option value="">All Semesters</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Filter Academic Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2025"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] font-mono shadow-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleApplyQueryFilter}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                      >
                        Execute Query
                      </button>
                    </div>
                  </div>

                  {/* Filter Query statistics view */}
                  {filterQueryTriggered ? (
                    <div className="space-y-4 animate-fadeIn">
                      {filteredStats ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Results</span>
                              <span className="text-lg font-bold font-mono text-[#11355d]">{filteredStats.resultsCount}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Unique Students</span>
                              <span className="text-lg font-bold font-mono text-[#11355d]">{filteredStats.uniqueStudents}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Unique Courses</span>
                              <span className="text-lg font-bold font-mono text-[#11355d]">{filteredStats.uniqueCourses}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">GPA weighted performance</span>
                              <span className="text-lg font-bold font-mono text-[#f59e0b]">{filteredStats.avgGPA} / 4.0</span>
                            </div>
                          </div>

                          {filteredResults.length > 0 && (
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto shadow-sm">
                              <table className="min-w-full divide-y divide-slate-200 text-xs">
                                <thead className="bg-[#11355d]/10 sticky top-0 text-slate-700">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left font-bold uppercase">Student ID</th>
                                    <th className="px-4 py-2.5 text-left font-bold uppercase">Name</th>
                                    <th className="px-4 py-2.5 text-left font-bold uppercase">Course</th>
                                    <th className="px-4 py-2.5 text-center font-bold uppercase">Grade</th>
                                    <th className="px-4 py-2.5 text-center font-bold uppercase">Points</th>
                                    <th className="px-4 py-2.5 text-left font-bold uppercase">Remarks</th>
                                    <th className="px-4 py-2.5 text-left font-bold uppercase">Semester</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                  {filteredResults.map((r, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/70 transition">
                                      <td className="px-4 py-2 font-mono text-[#1a518c] font-bold">{r.student_id_code}</td>
                                      <td className="px-4 py-2 font-semibold text-slate-800">{r.student_name}</td>
                                      <td className="px-4 py-2 font-mono font-bold text-slate-600">{r.course_code}</td>
                                      <td className="px-4 py-2 text-center">
                                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-250 font-mono text-[10px]">{r.letter_grade}</span>
                                      </td>
                                      <td className="px-4 py-2 text-center font-mono font-bold text-slate-800">{r.grade_point}</td>
                                      <td className="px-4 py-2 italic text-slate-400 truncate max-w-[100px]" title={r.remarks}>{r.remarks || "PASS"}</td>
                                      <td className="px-4 py-2 text-slate-500 font-semibold">{r.semester} {r.passing_year}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-8 bg-slate-50 rounded-xl text-center text-sm text-slate-500 border border-dashed border-slate-200">
                          No results found matching this specific Year/Semester query filter option. Try another query.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-xl text-center text-sm text-slate-500 border border-dashed border-slate-200">
                      Specify a Semester and Academic Year above, then click <strong>Execute Query</strong> to view granular student transcripts.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DEPARTMENTS TAB SCREEN */}
            {activeTab === "departments" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Academic Departments</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage organization structure and departmental identifiers</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormDeptCode("");
                      setFormDeptName("");
                      setDeptError("");
                      setDeptSuccess("");
                      setShowDeptModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Department</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-400 italic bg-white border border-slate-200 rounded-2xl">
                      No departments registered yet. Add your first department!
                    </div>
                  ) : (
                    departments.map(dept => {
                      // count students in dept
                      const studentCount = students.filter(s => s.department_id === dept.id).length;
                      return (
                        <div key={dept.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition flex flex-col justify-between border-t-4 border-t-[#11355d]">
                          <div className="space-y-2">
                            <span className="px-2.5 py-1 bg-sky-50 text-[#11355d] border border-sky-150 rounded-lg text-xs font-black font-mono">
                              {dept.code}
                            </span>
                            <h3 className="text-base font-bold text-slate-800 mt-2">{dept.name}</h3>
                          </div>
                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold">Registered Students:</span>
                            <span className="font-bold text-[#11355d] font-mono text-sm bg-slate-50 px-2 py-0.5 border border-slate-250 rounded">
                              {studentCount}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* REPORTS TAB SCREEN */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Analytics & Grading Reports</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Granular feedback digests, grade point distribution counts, and performance metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Grade Distribution Block */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                    <h3 className="text-sm font-bold text-[#11355d] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 font-sans">
                      Overall Letter Grade Distribution
                    </h3>
                    <div className="space-y-3">
                      {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"].map(grade => {
                        const count = results.filter(r => r.letter_grade === grade).length;
                        const percentage = results.length > 0 ? (count / results.length) * 100 : 0;
                        return (
                          <div key={grade} className="flex items-center gap-3">
                            <span className="w-8 text-xs font-black text-slate-600 font-mono">{grade}</span>
                            <div className="flex-1 h-3 bg-slate-55 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-gradient-to-r from-sky-500 to-[#1b4372] rounded-full transition-all duration-500"
                              />
                            </div>
                            <span className="w-20 text-right text-xs font-mono font-bold text-slate-850">{count} result(s)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary performance stats block */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                      <h3 className="text-sm font-bold text-[#11355d] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 font-sans">
                        System Averages summary
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
                          <span className="text-2xl font-mono font-black text-[#11355d]">{students.length}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-[#cbd5e1] text-center">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Results</span>
                          <span className="text-2xl font-mono font-black text-[#11355d]">{results.length}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">GPA Mean Average</span>
                          <span className="text-2xl font-mono font-black text-[#f59e0b]">
                            {(
                              results.reduce((acc, r) => acc + (r.grade_point || 0), 0) /
                              (results.filter(r => r.grade_point !== null).length || 1)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Course Syllabus Count</span>
                          <span className="text-2xl font-mono font-black text-[#11355d]">{courses.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                      <h3 className="text-sm font-bold text-[#11355d] uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 font-sans">
                        Top active Course Syllabus
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {courses.slice(0, 5).map(c => {
                          const courseResCount = results.filter(r => r.course_id === c.id).length;
                          return (
                            <div key={c.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div>
                                <span className="font-mono font-bold text-slate-700">{c.code}</span>
                                <span className="text-slate-400 pl-2 font-medium">{c.title}</span>
                              </div>
                              <span className="font-mono font-extrabold bg-[#11355d]/10 px-2 py-0.5 rounded text-[#11355d]">{courseResCount} tests</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BACKUP TAB SCREEN */}
            {activeTab === "backup" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Database Backups & Resets</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Export system records dump to secure JSON file or execute fresh reset</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Box */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-2 text-[#1b4372] pb-2 border-b border-slate-100">
                      <Database className="h-5 w-5 text-[#f59e0b]" />
                      <span className="text-sm font-bold uppercase tracking-wider text-[#154273]">Export Database backup</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      Save a complete snapshot dump containing all registered academic departments, students registries, course catalogues, security trace logs, and grade results directly into a structured JSON backup configuration file.
                    </p>
                    <button
                      onClick={handleExportBackup}
                      className="w-full sm:w-auto px-6 py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                    >
                      Export DB JSON Backup
                    </button>
                  </div>

                  {/* Danger Zone resetting */}
                  <div className="bg-white border border-[#fca5a5]/50 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl shadow-red-100/30">
                    <div className="flex items-center gap-2 text-rose-600 pb-2 border-b border-rose-100">
                      <AlertTriangle className="h-5 w-5 animate-pulse" />
                      <span className="text-sm font-bold uppercase tracking-wider text-rose-600">Danger Zone Actions</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal font-medium">
                      Emptying the database will delete all transactional upload history logs, syllabus, course configurations, results, and student lists from the instance. Do this only when importing test files from a clean configuration.
                    </p>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                    >
                      Reset Instance Database
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECT CSV UPLOADER TAB */}
            {activeTab === "upload" && (
              <div className="space-y-6 font-sans">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Direct Results CSV Uploader</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Upload formatted text CSV files. Double checks, skips duplicate indices, and auto-generates missing records.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Form Details */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/50">
                    <form onSubmit={handleCSVUpload} className="space-y-6">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Session Semester
                          </label>
                          <select
                            value={uploaderSemester}
                            onChange={(e) => setUploaderSemester(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          >
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                            <option value="Fall">Fall</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Session Academic Year
                          </label>
                          <input
                            type="number"
                            required
                            value={uploaderYear}
                            onChange={(e) => setUploaderYear(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Academic Department
                          </label>
                          <select
                            value={uploaderDept}
                            onChange={(e) => setUploaderDept(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          >
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.code} - {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Identification Unique Identifier Key
                          </label>
                          <select
                            value={uploaderKeyField}
                            onChange={(e) => setUploaderKeyField(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          >
                            <option value="id">Student ID (student_id column)</option>
                            <option value="name">Student Name (name column)</option>
                          </select>
                        </div>
                      </div>

                      {/* File Selection Box */}
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:border-slate-300/80 hover:bg-slate-50/80 transition shadow-inner">
                        <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                        <span className="block text-sm font-semibold mb-1 text-slate-700">
                          Select the results CSV file to process
                        </span>
                        <span className="block text-[11px] text-slate-400 mb-4 max-w-md mx-auto leading-normal">
                          Expected pattern: StudentID, Name, CourseCode, CourseTitle, Credit, ECR, LetterGrade, GradePoint, Remarks
                        </span>
                        
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => setUploaderFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="file-raw-chooser"
                        />
                        <label
                          htmlFor="file-raw-chooser"
                          className="px-5 py-2.5 bg-[#11355d] hover:bg-[#0c2644] text-white text-xs font-bold rounded-xl cursor-pointer shadow inline-block uppercase tracking-wider"
                        >
                          Browse CSV File
                        </label>

                        {uploaderFile && (
                          <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl inline-flex items-center gap-3 text-left shadow-sm">
                            <FileText className="h-5 w-5 text-[#11355d] shrink-0" />
                            <div>
                              <span className="block text-xs font-mono font-bold text-slate-800 max-w-xs truncate">{uploaderFile.name}</span>
                              <span className="block text-[10px] text-slate-400 font-semibold font-mono">{(uploaderFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {uploaderUploadError && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2 font-semibold">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{uploaderUploadError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={uploaderProcessing || !uploaderFile}
                        className="w-full py-4 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                      >
                        {uploaderProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Processing CSV and transaction queues...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4.5 w-4.5" />
                            <span>Process Results Import</span>
                          </>
                        )}
                      </button>

                    </form>
                  </div>

                  {/* Right Column: Dynamic Statistics Summary output */}
                  <div className="lg:col-span-4 select-none">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xl shadow-slate-200/50">
                      <h4 className="text-sm font-bold text-[#154273] border-b border-slate-100 pb-3 uppercase tracking-wider">
                        Uploader Rules & Validation
                      </h4>

                      <div className="space-y-4 text-xs text-slate-500 leading-relaxed font-medium">
                        <p>
                          🔹 <strong>Auto Student Creation</strong>: If student ID or Name is unrecognized, they are automatically generated in the database.
                        </p>
                        <p>
                          🔹 <strong>Smart Student Update</strong>: Existing names set to &quot;Unknown&quot; are automatically updated to actual matched CSV names.
                        </p>
                        <p>
                          🔹 <strong>Composite Key Rules</strong>: Prevents duplicating the same course grades for a student in the same semester.
                        </p>
                      </div>

                      {uploaderUploadSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-inner"
                        >
                          <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
                            <CheckCircle className="h-4.5 w-4.5" />
                            <span>Import Completed!</span>
                          </div>

                          <div className="space-y-2 text-xs font-mono text-slate-700">
                            <div>👥 Students Created: <strong className="text-emerald-700 font-bold">{uploaderUploadSuccess.students_created}</strong></div>
                            <div>📝 Names Updated: <strong className="text-amber-600 font-bold">{uploaderUploadSuccess.students_updated || 0}</strong></div>
                            <div>📚 Courses Created: <strong className="text-indigo-600 font-bold">{uploaderUploadSuccess.courses_created}</strong></div>
                            <div>🏆 Results Created: <strong className="text-sky-600 font-bold">{uploaderUploadSuccess.results_created}</strong></div>
                            <div>🔄 Duplicates Skipped: <strong className="text-slate-400 font-bold">{uploaderUploadSuccess.skipped_duplicates}</strong></div>
                          </div>

                          {uploaderUploadSuccess.errors_count > 0 && (
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <span className="block text-[11px] font-bold text-rose-700 mb-1">
                                Ignored Row Warnings ({uploaderUploadSuccess.errors_count})
                              </span>
                              <div className="max-h-24 overflow-y-auto text-[10px] text-slate-500 space-y-1 font-mono leading-normal">
                                {uploaderUploadSuccess.errors.map((err: string, eIdx: number) => (
                                  <div key={eIdx}>• {err}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* COLUMNS MAPPER TAB SCREEN */}
            {activeTab === "mapper" && (
              <div className="space-y-6 font-sans">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Flexible Columns Schema CSV Mapper</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Upload raw data with custom headers. Map columns to match the target schema safely.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                  {mapperStep === 1 ? (
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
                        <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h4 className="text-base font-bold text-slate-800 mb-2">Step 1: Choose custom CSV/Text File</h4>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 leading-normal font-medium">
                          Our mapper parses column headers so you can match mismatched, customized spreadsheet models with NEUB system databases.
                        </p>

                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleMapperFileChange}
                          className="hidden"
                          id="mapper-file-selector"
                        />
                        <label
                          htmlFor="mapper-file-selector"
                          className="px-6 py-3 bg-[#11355d] hover:bg-[#0c2644] text-white font-bold rounded-xl cursor-pointer shadow transition inline-block uppercase text-xs tracking-wider"
                        >
                          Select CSV File
                        </label>
                      </div>

                      {mapperImportError && (
                        <div id="mapper-import-err" className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                          {mapperImportError}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Step 2: Mapping controls
                    <form onSubmit={handleMapperImportSubmit} className="space-y-8">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Original File</span>
                          <h4 className="text-sm font-bold font-mono text-[#1a518c]">{mapperFile?.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setMapperStep(1); setMapperFile(null); }}
                          className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                        >
                          Change File
                        </button>
                      </div>

                      {/* Preview Sample Table */}
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Parsed File Preview (First 5 Rows)
                        </span>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                          <table className="min-w-full divide-y divide-slate-200 text-xs text-slate-700 bg-white">
                            <thead className="bg-[#11355d]/10 text-slate-700 font-bold">
                              <tr>
                                {mapperHeaders.map((h, idx) => (
                                  <th key={idx} className="px-3 py-2 text-left font-bold font-mono uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 text-slate-700 bg-white">
                              {mapperPreviewRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50 transition">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3 py-2 max-w-[120px] truncate font-medium">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mapping Config Selection */}
                      <div className="space-y-4">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                          Configure Mapped Columns Scheme Matching
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: "studentId", label: "Student ID Column *", required: true },
                            { key: "name", label: "Student Name Column *", required: true },
                            { key: "email", label: "Email Address Column", required: false },
                            { key: "courseCode", label: "Course Code Column *", required: true },
                            { key: "courseTitle", label: "Course Title Column", required: false },
                            { key: "credit", label: "Course Credit Column", required: false },
                            { key: "ecr", label: "ECR Credit Column", required: false },
                            { key: "grade", label: "Letter Grade Column", required: false },
                            { key: "point", label: "Grade Points Column", required: false },
                            { key: "remarks", label: "Remarks Column", required: false }
                          ].map(cfg => (
                            <div key={cfg.key}>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                {cfg.label} {cfg.required && <span className="text-rose-500">*</span>}
                              </label>
                              <select
                                value={mapperSelections[cfg.key as keyof typeof mapperSelections]}
                                onChange={(e) => setMapperSelections({ ...mapperSelections, [cfg.key]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                              >
                                <option value="">[Ignore/Generate Default]</option>
                                {mapperHeaders.map((head, hIdx) => (
                                  <option key={hIdx} value={head}>{head}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mapping Target Selection Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Import Semester</label>
                          <select
                            value={mapperSemester}
                            onChange={(e) => setMapperSemester(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          >
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                            <option value="Fall">Fall</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Import Year</label>
                          <input
                            type="number"
                            value={mapperYear}
                            onChange={(e) => setMapperYear(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Default Department</label>
                          <select
                            value={mapperDeptId}
                            onChange={(e) => setMapperDeptId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                          >
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.code} - {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {mapperImportError && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                          {mapperImportError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={mapperProcessing}
                        className="w-full py-4 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                      >
                        {mapperProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Processing Column Mapping configuration...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Save config & commit transactional import</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Columns map success detail dialog */}
                  {mapperImportSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold mb-3">
                        <Check className="h-5 w-5 text-emerald-700 animate-bounce" />
                        <span>Column mapping import worked Successfully!</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-700">
                        <div>Students Created: <strong>{mapperImportSuccess.students_created}</strong></div>
                        <div>Names Updated: <strong>{mapperImportSuccess.students_updated || 0}</strong></div>
                        <div>Courses Created: <strong>{mapperImportSuccess.courses_created}</strong></div>
                        <div>Results Created: <strong>{mapperImportSuccess.results_created}</strong></div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* STUDENTS REGISTRY MANAGE SCREEN */}
            {activeTab === "students" && (
              <div className="space-y-6">
                
                {/* Registry header row */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Students Registry</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Total verified active students in systems database</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormStdId("");
                      setFormStdName("");
                      setFormStdEmail("");
                      setFormStdDept(departments.length > 0 ? String(departments[0].id) : "");
                      setEditingStudent(null);
                      setIsDuplicateStd(false);
                      setDuplicateWarningMsg("");
                      setShowStudentModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>
                </div>

                {/* Filter and search students bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center shadow-md shadow-slate-200/55">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                      placeholder="Search by student id, name, or email..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <select
                      value={studentDeptFilter}
                      onChange={(e) => { setStudentDeptFilter(e.target.value); setStudentPage(1); }}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students Registry Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-[#11355d]/10 text-slate-700 font-bold">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Department</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {paginatedStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                              No student records matched your filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 font-mono text-sm font-bold text-[#1a518c]">{student.student_id}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-500 font-medium">{student.email}</td>
                              <td className="px-6 py-4 text-xs">
                                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-slate-700 font-semibold uppercase">
                                  {getDeptCodeById(student.department_id)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingStudent(student);
                                      setFormStdId(student.student_id);
                                      setFormStdName(student.name);
                                      setFormStdEmail(student.email);
                                      setFormStdDept(String(student.department_id));
                                      setIsDuplicateStd(false);
                                      setDuplicateWarningMsg("");
                                      setShowStudentModal(true);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer transition shadow-sm"
                                    title="Edit Student detail"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setShowConfirmDeleteId(student.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 cursor-pointer transition shadow-[#rose]/10"
                                    title="Delete Student and related results"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control footer bar */}
                  {totalStudentPages > 1 && (
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-150 text-xs text-slate-500">
                      <span className="font-semibold text-slate-500">
                        Page {studentPage} of {totalStudentPages} (total {filteredStudents.length} entries matching)
                      </span>
                      <div className="inline-flex gap-2">
                        <button
                          disabled={studentPage === 1}
                          onClick={() => setStudentPage(studentPage - 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded font-bold cursor-pointer transition"
                        >
                          Prev
                        </button>
                        <button
                          disabled={studentPage === totalStudentPages}
                          onClick={() => setStudentPage(studentPage + 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded font-bold cursor-pointer transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COURSES & LISTING TAB SCREEN */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Course Catalogues</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage institutional standard course code credentials</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormCourseCode("");
                      setFormCourseTitle("");
                      setFormCourseCredit(3);
                      setFormCourseEcr(3);
                      setFormCourseTeacher("");
                      setEditingCourse(null);
                      setShowCourseModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow cursor-pointer transition uppercase text-xs tracking-wider"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Course</span>
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-[#11355d]/10 text-slate-700 font-bold">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Course Code</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Course Title</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Credit Hours</th>
                          <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Conducting Teacher / Instructor</th>
                          <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {courses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No courses recorded.</td>
                          </tr>
                        ) : (
                          courses.map(course => (
                            <tr key={course.id} className="hover:bg-slate-50/50 transition bg-white">
                              <td className="px-6 py-4 font-mono font-bold text-[#1a518c]">{course.code}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{course.title}</td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{course.credit} CH</td>
                              <td className="px-6 py-4 text-left text-slate-500 font-semibold">{course.teacher || "Assigned Faculty"}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCourse(course);
                                      setFormCourseCode(course.code);
                                      setFormCourseTitle(course.title);
                                      setFormCourseCredit(course.credit);
                                      setFormCourseEcr(course.ecr || 3);
                                      setFormCourseTeacher(course.teacher || "");
                                      setShowCourseModal(true);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer shadow-sm transition"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-250 cursor-pointer transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM ACTIVITY LOGS VIEW */}
            {activeTab === "logs" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">System Security Activity Logs</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Monitoring real-time request audits and admin operations</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-2 text-[#1b4372] pb-2 border-b border-slate-100">
                    <Activity className="h-5 w-5 text-[#f59e0b]" />
                    <span className="text-sm font-bold uppercase tracking-wider">Live Audit Trace</span>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl shadow-inner scrollbar-thin">
                    <div className="divide-y divide-slate-100 bg-white">
                      {systemLogs.length === 0 ? (
                        <p className="p-8 text-center text-slate-400 italic text-sm">No activity logs recorded yet.</p>
                      ) : (
                        systemLogs.map(log => (
                          <div key={log.id} className="p-4 hover:bg-slate-50/50 text-xs flex justify-between items-start gap-4 transition bg-white">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-600">
                                  {log.request_type}
                                </span>
                                <p className="font-bold text-slate-850 text-sm">{log.action}</p>
                              </div>
                              <span className="block text-[11px] text-slate-400 font-mono font-medium">
                                Source Node IP: {log.ip}
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[11px] font-bold whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY & PASSWORD SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#154273] font-sans">Security & Password Settings</h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Change password credentials or edit configuration files</p>
                </div>

                <div className="max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    
                    <div className="flex items-center gap-2 text-[#f59e0b] mb-2 border-b border-slate-100 pb-2">
                      <Lock className="h-5 w-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#154273]">Update Admin Password</h3>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 chars, 1 uppercase, 1 special char"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Verify New Password</label>
                      <input
                        type="password"
                        required
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                      />
                    </div>

                    {settingsError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex gap-1.5 items-center font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{settingsError}</span>
                      </div>
                    )}

                    {settingsSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex gap-1.5 items-center font-semibold">
                        <Check className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span>{settingsSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl shadow uppercase tracking-wider text-xs cursor-pointer transition-all"
                    >
                      Update Password Credentials
                    </button>

                  </form>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL 1: ADD / EDIT STUDENT MODAL WITH DUPLICATES LOGIC */}
      <AnimatePresence>
        {showStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-[#11355d] text-white p-6 flex justify-between items-center">
                <h3 className="text-base font-black tracking-tight text-white uppercase">
                  {editingStudent ? "Edit Student Details" : "Add Student Record"}
                </h3>
                <button 
                  onClick={() => setShowStudentModal(false)}
                  className="text-slate-300 hover:text-white cursor-pointer transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="p-6 space-y-4 font-sans bg-white">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Student ID Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formStdId}
                    onChange={(e) => setFormStdId(e.target.value)}
                    placeholder="e.g. 150203020050"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Full Student Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formStdName}
                    onChange={(e) => setFormStdName(e.target.value)}
                    placeholder="e.g. Abdullah Al Mamun"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Email address (Optional - auto generates)
                  </label>
                  <input
                    type="email"
                    value={formStdEmail}
                    onChange={(e) => setFormStdEmail(e.target.value)}
                    placeholder="e.g. mamun@neub.edu.bd"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-mono focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Department</label>
                  <select
                    value={formStdDept}
                    onChange={(e) => setFormStdDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Duplicates duplicate warning display alert */}
                {isDuplicateStd && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2 font-semibold">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                    <span>{duplicateWarningMsg}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer transition ${
                      isDuplicateStd 
                        ? "bg-[#f59e0b] hover:bg-[#d97706] text-white" 
                        : "bg-[#1b4372] hover:bg-[#122f51] text-white"
                    }`}
                  >
                    {isDuplicateStd ? "⚠ Update Existing Student" : (editingStudent ? "Save Changes" : "Create Student Record")}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CONFIRM CASCADE STUDENT DELETION DANGER ZONE */}
      <AnimatePresence>
        {showConfirmDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl bg-white"
            >
              <div className="p-6 text-center space-y-4">
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-full inline-block">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-base font-black tracking-tight text-slate-800 uppercase">Confirm Record Cascade Removal</h3>
                <p className="text-xs text-slate-550 leading-normal font-medium">
                  Caution: Deleting this student is irreversible. It will also <strong>permanently delete all results grades</strong> associated with this student ID.
                </p>
                
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => setShowConfirmDeleteId(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(showConfirmDeleteId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow"
                  >
                    Yes, Delete Records
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: COURSE MODAL */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-[#11355d] text-white p-6 flex justify-between items-center">
                <h3 className="text-base font-black tracking-tight text-white uppercase">
                  {editingCourse ? "Edit Course Catalogue" : "Create New Course"}
                </h3>
                <button onClick={() => setShowCourseModal(false)} className="text-slate-300 hover:text-white cursor-pointer transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="p-6 space-y-4 font-sans bg-white">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={formCourseCode}
                    onChange={(e) => setFormCourseCode(e.target.value)}
                    placeholder="e.g. CSE-101"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={formCourseTitle}
                    onChange={(e) => setFormCourseTitle(e.target.value)}
                    placeholder="e.g. Introduction to Programming"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Credit Hours *</label>
                    <input
                      type="number"
                      required
                      value={formCourseCredit}
                      onChange={(e) => setFormCourseCredit(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Conducting Teacher / Faculty *</label>
                    <input
                      type="text"
                      required
                      value={formCourseTeacher}
                      onChange={(e) => setFormCourseTeacher(e.target.value)}
                      placeholder="e.g. Associate Prof. Md. Tariqul Islam"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer shadow transition"
                  >
                    {editingCourse ? "Save Changes" : "Create Course"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: CONFIRM DB RESET WARN */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center space-y-4 bg-white">
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-full inline-block">
                  <Database className="h-8 w-8 animate-bounce" />
                </div>
                <h3 className="text-base font-black tracking-tight text-slate-850 uppercase">Clear Configuration Database</h3>
                <p className="text-xs text-slate-550 leading-normal font-medium">
                  Are you absolutely sure you want to clear the transactional database? This will completely empty all students, courses, results, and upload logs to test fresh, clean system imports from absolute scratch.
                </p>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearDatabase}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: ASSIGN RESULT GRADE MANUALLY MODAL */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-[#11355d] text-white p-6 flex justify-between items-center bg-gradient-to-r from-[#11355d] to-[#122f51]">
                <h3 className="text-sm font-black tracking-wider text-white uppercase font-sans">
                  Assign Course Grade
                </h3>
                <button 
                  onClick={() => setShowResultModal(false)}
                  className="text-slate-300 hover:text-white cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveResult} className="p-6 space-y-4 font-sans bg-white">
                {/* Searchable Student Combobox Selector */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Search Student <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type student name or ID..."
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        setIsStudentDropdownOpen(true);
                        if (e.target.value === "") {
                          setFormResStudentId("");
                        }
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      onBlur={() => {
                        // Allow click inside dropdown to register before hiding
                        setTimeout(() => setIsStudentDropdownOpen(false), 200);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] font-medium"
                      required
                    />
                    {formResStudentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormResStudentId("");
                          setStudentSearchQuery("");
                        }}
                        className="absolute right-3.5 top-2.5 text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {isStudentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto index-100 divide-y divide-slate-100">
                      {students.filter(s => {
                        const query = studentSearchQuery.toLowerCase();
                        return s.student_id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
                      }).length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-400 italic">No corresponding student registry matched.</div>
                      ) : (
                        students.filter(s => {
                          const query = studentSearchQuery.toLowerCase();
                          return s.student_id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
                        }).slice(0, 30).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setFormResStudentId(s.id.toString());
                              setStudentSearchQuery(`${s.student_id} - ${s.name}`);
                              setIsStudentDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex justify-between items-center cursor-pointer"
                          >
                            <span>{s.student_id} - {s.name}</span>
                            {formResStudentId === s.id.toString() && (
                              <span className="text-emerald-500 font-bold">✓</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Searchable Course Combobox Selector */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Syllabus Course Catalogue <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type course code or title..."
                      value={courseSearchQuery}
                      onChange={(e) => {
                        setCourseSearchQuery(e.target.value);
                        setIsCourseDropdownOpen(true);
                        if (e.target.value === "") {
                          setFormResCourseId("");
                        }
                      }}
                      onFocus={() => setIsCourseDropdownOpen(true)}
                      onBlur={() => {
                        // Allow click inside dropdown to register before hiding
                        setTimeout(() => setIsCourseDropdownOpen(false), 200);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] font-medium"
                      required
                    />
                    {formResCourseId && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormResCourseId("");
                          setCourseSearchQuery("");
                        }}
                        className="absolute right-3.5 top-2.5 text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {isCourseDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto index-100 divide-y divide-slate-100">
                      {courses.filter(c => {
                        const query = courseSearchQuery.toLowerCase();
                        return c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query);
                      }).length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-400 italic">No corresponding course catalogue matched.</div>
                      ) : (
                        courses.filter(c => {
                          const query = courseSearchQuery.toLowerCase();
                          return c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query);
                        }).slice(0, 30).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setFormResCourseId(c.id.toString());
                              setCourseSearchQuery(`${c.code} - ${c.title}`);
                              setIsCourseDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex justify-between items-center cursor-pointer"
                          >
                            <span>{c.code} - {c.title}</span>
                            {formResCourseId === c.id.toString() && (
                              <span className="text-emerald-500 font-bold">✓</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Obtained Mark (0-100) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formResMark}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setFormResMark(val);
                      if (val !== "") {
                        const mapped = mapMarkToGradeAndPoint(val);
                        setFormResGrade(mapped.grade);
                        setFormResPoint(mapped.point);
                      } else {
                        setFormResGrade("");
                        setFormResPoint(0);
                      }
                    }}
                    placeholder="Enter numerical score (e.g., 85)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 primary-text uppercase tracking-wide">Calculated Grade</label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs select-none">
                      {formResGrade || "Pending Mark..."}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 primary-text uppercase tracking-wide">Calculated Point (GPA)</label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs select-none">
                      {formResGrade ? formResPoint.toFixed(2) : "0.00"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Semester <span className="text-rose-500">*</span></label>
                    <select
                      value={formResSemester}
                      onChange={(e) => setFormResSemester(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] cursor-pointer font-medium"
                      required
                    >
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Passing Year <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={formResYear}
                      onChange={(e) => setFormResYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Remarks</label>
                  <input
                    type="text"
                    value={formResRemarks}
                    onChange={(e) => setFormResRemarks(e.target.value)}
                    placeholder="e.g. PASS, ADVANCED, etc."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                {resultsError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[#b91c1c] text-[11px] flex gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{resultsError}</span>
                  </div>
                )}

                {resultsSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] flex gap-2 font-semibold">
                    <Check className="h-4.5 w-4.5 shrink-0 text-emerald-600 animate-bounce" />
                    <span>{resultsSuccess}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowResultModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer shadow transition"
                  >
                    Save Grade Result
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: CREATE DEPARTMENT MODAL */}
      <AnimatePresence>
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-250 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-[#11355d] text-white p-6 flex justify-between items-center bg-gradient-to-r from-[#11355d] to-[#122f51]">
                <h3 className="text-sm font-black tracking-wider text-white uppercase font-sans">
                  Create Class Department
                </h3>
                <button 
                  onClick={() => setShowDeptModal(false)}
                  className="text-slate-300 hover:text-white cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 font-sans bg-white">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDeptCode}
                    onChange={(e) => setFormDeptCode(e.target.value)}
                    placeholder="e.g. CSE, EEE, BBA, ENG"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formDeptName}
                    onChange={(e) => setFormDeptName(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  />
                </div>

                {deptError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[#b91c1c] text-[11px] flex gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{deptError}</span>
                  </div>
                )}

                {deptSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] flex gap-2 font-semibold">
                    <Check className="h-4.5 w-4.5 shrink-0 text-emerald-600 animate-bounce" />
                    <span>{deptSuccess}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1b4372] hover:bg-[#122f51] text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer shadow transition"
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
