import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { DbSchema, Student, Course, Result, UploadLog, SystemLog } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to get database
function getDB(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data) as DbSchema;
      
      // Auto-migration for missing or old last-4-digit student password hashes to DefaultP12!
      let migrated = false;
      const defaultPasswordHash = crypto.createHash("sha256").update("DefaultP12!").digest("hex");
      if (db.students && Array.isArray(db.students)) {
        db.students.forEach(s => {
          const sidStr = String(s.student_id).trim();
          const last4 = sidStr.length >= 4 ? sidStr.slice(-4) : sidStr;
          const last4Hash = crypto.createHash("sha256").update(last4).digest("hex");
          
          if (!s.password_hash || s.password_hash === last4Hash) {
            s.password_hash = defaultPasswordHash;
            migrated = true;
          }
        });
      }
      if (migrated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }
      return db;
    }
  } catch (error) {
    console.error("Error reading database", error);
  }
  // Default structure if missing
  return {
    departments: [],
    students: [],
    courses: [],
    results: [],
    upload_logs: [],
    system_logs: [],
    admin_user: {
      username: "saklan",
      password_hash: "6b694a6de71dd8b317afca1c98dc8c47a0d34848061c3565533cde5f1701c0d9"
    }
  };
}

// Helper to save database
function saveDB(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database", error);
  }
}

// Helper for hashing password and validating
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// System logging helper
function logAction(ip: string, requestType: string, action: string) {
  const db = getDB();
  const newLog: SystemLog = {
    id: db.system_logs.length > 0 ? Math.max(...db.system_logs.map(l => l.id)) + 1 : 1,
    ip: ip || "127.0.0.1",
    request_type: requestType,
    action,
    timestamp: new Date().toISOString()
  };
  db.system_logs.unshift(newLog);
  // Keep only last 200 system logs
  if (db.system_logs.length > 200) {
    db.system_logs = db.system_logs.slice(0, 200);
  }
  saveDB(db);
}

// Parser for CSV text supporting quotes
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
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
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
  return lines.map(r => r.map(cell => cell.trim()));
}

// --- API ROUTES ---

// 1. PUBLIC SEARCH PORTAL ENDPOINT
// GET /api/search?student_id=5624205101065&semester=Spring&department=CSE&passing_year=2025
app.get("/api/search", (req, res) => {
  const studentIdParam = req.query.student_id ? String(req.query.student_id).trim() : "";
  const semesterParam = req.query.semester ? String(req.query.semester).trim() : "";
  const departmentParam = req.query.department ? String(req.query.department).trim() : "";
  const yearParam = req.query.passing_year ? parseInt(String(req.query.passing_year), 10) : NaN;

  if (!studentIdParam) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  const db = getDB();

  // Find department matching code
  let targetDeptId: number | null = null;
  if (departmentParam) {
    const dept = db.departments.find(d => d.code.toUpperCase() === departmentParam.toUpperCase());
    if (dept) {
      targetDeptId = dept.id;
    }
  }

  // Filter students: case insensitive matching supporting partials if requested, or exact match depending on input
  // Let's support exact matching on student_id for specific lookup, but fallback nicely.
  const matchedStudents = db.students.filter(student => {
    const idMatch = student.student_id === studentIdParam || student.alternate_id === studentIdParam;
    const deptMatch = targetDeptId ? student.department_id === targetDeptId : true;
    return idMatch && deptMatch;
  });

  if (matchedStudents.length === 0) {
    return res.json({ success: true, total_students: 0, total_courses: 0, data: [] });
  }

  const resultData = matchedStudents.map(student => {
    // get department code
    const dept = db.departments.find(d => d.id === student.department_id);
    const departmentCode = dept ? dept.code : "";

    // get results for this student
    let studentResults = db.results.filter(r => r.student_id === student.id);

    // Filter results by semester/year if specified
    if (semesterParam) {
      studentResults = studentResults.filter(r => r.semester.toUpperCase() === semesterParam.toUpperCase());
    }
    if (!isNaN(yearParam)) {
      studentResults = studentResults.filter(r => r.passing_year === yearParam);
    }

    const coursesList = studentResults.map(r => {
      const course = db.courses.find(c => c.id === r.course_id);
      return {
        code: course ? course.code : "",
        title: course ? course.title : "Unknown Course",
        credit: course ? String(course.credit) : "0",
        ecr: course ? String(course.ecr) : "0",
        teacher: course?.teacher || "Assigned Faculty",
        grade: r.letter_grade,
        points: r.grade_point !== null ? r.grade_point.toFixed(2) : "0.00",
        remarks: r.remarks || ""
      };
    });

    const finalSemester = studentResults.length > 0 ? studentResults[0].semester : semesterParam || "Spring";
    const finalYear = studentResults.length > 0 ? String(studentResults[0].passing_year) : String(yearParam || 2025);

    return {
      student_id: student.student_id,
      student_name: student.name,
      department_code: departmentCode,
      semester: finalSemester,
      passing_year: finalYear,
      courses: coursesList
    };
  }).filter(data => data.courses.length > 0); // Only return students who have matching courses in this semester

  let total_courses = 0;
  resultData.forEach(s => total_courses += s.courses.length);

  res.json({
    success: true,
    total_students: resultData.length,
    total_courses: total_courses,
    data: resultData
  });
});

// 2. DEPARTMENTS ENDPOINTS
app.get("/api/departments", (req, res) => {
  const db = getDB();
  res.json(db.departments);
});

app.post("/api/departments", (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) {
    return res.status(400).json({ success: false, message: "Code and Name are required." });
  }
  const db = getDB();
  
  // check duplicate
  const exists = db.departments.some(d => d.code.toUpperCase() === code.toUpperCase());
  if (exists) {
    return res.status(400).json({ success: false, message: `Department code '${code}' already exists.` });
  }

  const newDept = {
    id: db.departments.length > 0 ? Math.max(...db.departments.map(d => d.id)) + 1 : 1,
    code: code.toUpperCase().trim(),
    name: name.trim()
  };
  
  db.departments.push(newDept);
  saveDB(db);
  logAction(req.ip || "", "POST", `Department created: ${newDept.code} - ${newDept.name}`);
  res.json({ success: true, department: newDept });
});

// 3. ADMIN LOGIN
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and Password are required." });
  }

  const hash = hashPassword(password);
  if (username === db.admin_user.username && hash === db.admin_user.password_hash) {
    db.admin_user.last_login = new Date().toISOString();
    saveDB(db);
    logAction(req.ip || "", "POST", "Admin logged in successfully");
    return res.json({ success: true, username: db.admin_user.username });
  } else {
    logAction(req.ip || "", "POST", `Failed login attempt for username: ${username}`);
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }
});

// 4. CHANGE PASSWORD
app.post("/api/auth/change-password", (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const db = getDB();

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const curHash = hashPassword(currentPassword);
  if (username !== db.admin_user.username || curHash !== db.admin_user.password_hash) {
    return res.status(401).json({ success: false, message: "Current password is incorrect." });
  }

  // Password requirements
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
  }
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);
  if (!hasUpper || !hasSpecial) {
    return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter and one special character." });
  }

  db.admin_user.password_hash = hashPassword(newPassword);
  saveDB(db);
  logAction(req.ip || "", "POST", "Admin password changed successfully");
  res.json({ success: true, message: "Password updated successfully." });
});

// 4b. STUDENT PORTAL SYSTEM
// Student Registration (or activation)
app.post("/api/student/register", (req, res) => {
  const { student_id, name, email, password, department_id, phone, session } = req.body;
  if (!student_id || !password || !department_id || !name) {
    return res.status(400).json({ success: false, message: "Student ID, Name, Department, and Password are required." });
  }

  const db = getDB();
  const trimmedId = String(student_id).trim();
  const existingIdx = db.students.findIndex(s => s.student_id === trimmedId);

  const hash = hashPassword(password);

  if (existingIdx !== -1) {
    const defaultHash = hashPassword("DefaultP12!");

    // If student exists but is already registered with a customized password (different from default)
    if (db.students[existingIdx].password_hash && db.students[existingIdx].password_hash !== defaultHash) {
      return res.status(400).json({ success: false, message: "This Student ID is already registered. Please login or contact admin." });
    }
    // Activate/override existing uploaded student record
    db.students[existingIdx].password_hash = hash;
    db.students[existingIdx].name = name;
    db.students[existingIdx].email = email || `${trimmedId.toLowerCase()}@neub.edu.bd`;
    db.students[existingIdx].phone = phone || "";
    db.students[existingIdx].session = session || "Spring 2026";
    saveDB(db);
    logAction(req.ip || "", "POST", `Activated Student Portal Account for ID: ${trimmedId}`);
    return res.json({ success: true, message: "Account registered successfully!", student: db.students[existingIdx] });
  } else {
    // Register complete new student record
    const newStudent: Student = {
      id: db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1,
      student_id: trimmedId,
      name,
      email: email || `${trimmedId.toLowerCase()}@neub.edu.bd`,
      password_hash: hash,
      department_id: Number(department_id),
      phone: phone || "",
      session: session || "Spring 2026",
      key_field: "id"
    };
    db.students.push(newStudent);
    saveDB(db);
    logAction(req.ip || "", "POST", `Created & Registered new Student Portal Account for ID: ${trimmedId}`);
    return res.json({ success: true, message: "Account registered and created successfully!", student: newStudent });
  }
});

// Student Login
app.post("/api/student/login", (req, res) => {
  const { student_id, password } = req.body;
  if (!student_id || !password) {
    return res.status(400).json({ success: false, message: "Student ID and Password are required." });
  }

  const db = getDB();
  const trimmedId = String(student_id).trim();
  
  // Find by Student ID or alternate ID
  const student = db.students.find(s => s.student_id === trimmedId || s.alternate_id === trimmedId);

  if (!student) {
    return res.status(401).json({ success: false, message: "Account not found. Please register first." });
  }

  if (!student.password_hash) {
    return res.status(401).json({ success: false, message: "Account exists but is not registered yet. Please register to activate." });
  }

  const hash = hashPassword(password);
  if (student.password_hash !== hash) {
    return res.status(401).json({ success: false, message: "Incorrect password." });
  }

  logAction(req.ip || "", "POST", `Student logged in: ${student.name} (${student.student_id})`);
  return res.json({ 
    success: true, 
    student: {
      id: student.id,
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      department_id: student.department_id,
      phone: student.phone || "",
      session: student.session || ""
    }
  });
});

// Student Profile Updates
app.post("/api/student/profile-update", (req, res) => {
  const { student_id, email, phone, current_password, new_password } = req.body;
  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student identification is missing." });
  }

  const db = getDB();
  const student = db.students.find(s => s.student_id === student_id);

  if (!student) {
    return res.status(404).json({ success: false, message: "Student record not found." });
  }

  if (email) student.email = email;
  if (phone !== undefined) student.phone = phone;

  if (new_password) {
    if (!current_password) {
      return res.status(400).json({ success: false, message: "Current password is required to set a new password." });
    }
    const curHash = hashPassword(current_password);
    if (student.password_hash !== curHash) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    student.password_hash = hashPassword(new_password);
  }

  saveDB(db);
  logAction(req.ip || "", "POST", `Student profile updated: ${student.name} (${student.student_id})`);
  res.json({ 
    success: true, 
    message: "Profile updated successfully.", 
    student: {
      id: student.id,
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      department_id: student.department_id,
      phone: student.phone || "",
      session: student.session || ""
    }
  });
});

// 5. STUDENTS ENDPOINTS
app.get("/api/students", (req, res) => {
  const db = getDB();
  res.json(db.students);
});

// Add / Update Patient/Student Duplicate Strategy
app.post("/api/students", (req, res) => {
  const { student_id, name, email, department_id } = req.body;
  if (!student_id || !name || !email || !department_id) {
    return res.status(400).json({ success: false, message: "Student ID, Name, Email and Department ID are required." });
  }

  const db = getDB();
  const existingIndex = db.students.findIndex(s => s.student_id === student_id);

  if (existingIndex !== -1) {
    // Update existing student with duplicates logic
    db.students[existingIndex].name = name;
    db.students[existingIndex].email = email;
    db.students[existingIndex].department_id = Number(department_id);
    saveDB(db);
    logAction(req.ip || "", "POST", `Updated existing Student: ${name} (${student_id})`);
    return res.json({ success: true, updated: true, student: db.students[existingIndex], message: `✓ Student '${name}' already existed. Record updated with new information.` });
  } else {
    // Create new
    const sidStr = String(student_id).trim();
    const defaultPasswordHash = hashPassword("DefaultP12!");

    const newStudent: Student = {
      id: db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1,
      student_id: sidStr,
      name: String(name).trim(),
      email: String(email).trim(),
      department_id: Number(department_id),
      password_hash: defaultPasswordHash,
      key_field: "id"
    };
    db.students.push(newStudent);
    saveDB(db);
    logAction(req.ip || "", "POST", `Created Student: ${name} (${student_id})`);
    return res.json({ success: true, updated: false, student: newStudent, message: `✓ Student '${name}' added successfully!` });
  }
});

// Delete student with cascade removal of results
app.delete("/api/students/:id", (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const db = getDB();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  // Count results
  const resultsCount = db.results.filter(r => r.student_id === studentId).length;

  // Filter out results
  db.results = db.results.filter(r => r.student_id !== studentId);
  db.students = db.students.filter(s => s.id !== studentId);

  saveDB(db);
  logAction(req.ip || "", "DELETE", `Deleted Student: ${student.name} (${student.student_id}) and cascades deleted ${resultsCount} results`);
  res.json({ success: true, message: `Successfully deleted student and ${resultsCount} results.` });
});

// 6. COURSES ENDPOINTS
app.get("/api/courses", (req, res) => {
  const db = getDB();
  res.json(db.courses);
});

app.post("/api/courses", (req, res) => {
  const { code, title, credit, ecr, teacher } = req.body;
  if (!code || !title) {
    return res.status(400).json({ success: false, message: "Course Code and Title are required." });
  }

  const db = getDB();
  const trimmedCode = String(code).trim().toUpperCase();
  const existingIdx = db.courses.findIndex(c => c.code.toUpperCase() === trimmedCode);

  if (existingIdx !== -1) {
    // Update existing course
    db.courses[existingIdx].title = title;
    db.courses[existingIdx].credit = Number(credit) || 3;
    db.courses[existingIdx].ecr = Number(ecr) || 3;
    db.courses[existingIdx].teacher = teacher || db.courses[existingIdx].teacher || "Assigned Faculty";
    saveDB(db);
    logAction(req.ip || "", "POST", `Updated existing Course: ${trimmedCode} - ${title}`);
    return res.json({ success: true, course: db.courses[existingIdx], updated: true });
  } else {
    // Create new course
    const newCourse: Course = {
      id: db.courses.length > 0 ? Math.max(...db.courses.map(c => c.id)) + 1 : 1,
      code: trimmedCode,
      title: title.trim(),
      credit: Number(credit) || 3,
      ecr: Number(ecr) || 3,
      teacher: teacher || "Assigned Faculty"
    };
    db.courses.push(newCourse);
    saveDB(db);
    logAction(req.ip || "", "POST", `Created Course: ${trimmedCode} - ${title}`);
    return res.json({ success: true, course: newCourse, updated: false });
  }
});

app.delete("/api/courses/:id", (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const db = getDB();
  const courseIndex = db.courses.findIndex(c => c.id === courseId);
  if (courseIndex === -1) {
    return res.status(404).json({ success: false, message: "Course not found." });
  }

  const course = db.courses[courseIndex];
  // deletes results associated with this course too for data integrity cascade
  const relatedResults = db.results.filter(r => r.course_id === courseId).length;
  db.results = db.results.filter(r => r.course_id !== courseId);
  db.courses = db.courses.filter(c => c.id !== courseId);

  saveDB(db);
  logAction(req.ip || "", "DELETE", `Deleted Course: ${course.code} and ${relatedResults} related results`);
  res.json({ success: true, message: `Successfully deleted course and ${relatedResults} related result records.` });
});

// 7. RESULTS GRADES GET/POST/DELETE
app.get("/api/results", (req, res) => {
  const db = getDB();
  // Join student and course info
  const resultsWithDetails = db.results.map(r => {
    const student = db.students.find(s => s.id === r.student_id);
    const course = db.courses.find(c => c.id === r.course_id);
    return {
      ...r,
      student_id_code: student ? student.student_id : "N/A",
      student_name: student ? student.name : "N/A",
      course_code: course ? course.code : "N/A",
      course_title: course ? course.title : "N/A"
    };
  });
  res.json(resultsWithDetails);
});

// Add individual result with duplicate checks (Composite unique check)
app.post("/api/results", (req, res) => {
  const { student_id_val, course_id_val, letter_grade, grade_point, remarks, semester, passing_year } = req.body;
  if (!student_id_val || !course_id_val || !letter_grade || !semester || !passing_year) {
    return res.status(400).json({ success: false, message: "Required fields missing." });
  }

  const db = getDB();
  const studentIdInt = Number(student_id_val);
  const courseIdInt = Number(course_id_val);
  const yearInt = Number(passing_year);

  // Check unique composite key: (student_id, course_id, semester, passing_year)
  const existingResultIdx = db.results.findIndex(r => 
    r.student_id === studentIdInt && 
    r.course_id === courseIdInt && 
    r.semester === semester && 
    r.passing_year === yearInt
  );

  const gradePointVal = grade_point !== undefined && grade_point !== null ? Number(grade_point) : null;

  if (existingResultIdx !== -1) {
    // Update existing result record instead of throwing error
    db.results[existingResultIdx].letter_grade = letter_grade;
    db.results[existingResultIdx].grade_point = gradePointVal;
    db.results[existingResultIdx].remarks = remarks || "";
    saveDB(db);
    logAction(req.ip || "", "POST", `Updated grade result index ${existingResultIdx} due to duplicate protection`);
    return res.json({ success: true, updated: true, result: db.results[existingResultIdx], message: "Existing grade result updated successfully." });
  } else {
    // Create new
    const newResult: Result = {
      id: db.results.length > 0 ? Math.max(...db.results.map(r => r.id)) + 1 : 1,
      student_id: studentIdInt,
      course_id: courseIdInt,
      letter_grade,
      grade_point: gradePointVal,
      remarks: remarks || "",
      semester,
      passing_year: yearInt
    };
    db.results.push(newResult);
    saveDB(db);
    logAction(req.ip || "", "POST", `Created new grade result record for student ${studentIdInt}`);
    return res.json({ success: true, updated: false, result: newResult, message: "Result created successfully!" });
  }
});

app.delete("/api/results/:id", (req, res) => {
  const resultId = parseInt(req.params.id, 10);
  const db = getDB();
  const initialCount = db.results.length;
  db.results = db.results.filter(r => r.id !== resultId);
  if (db.results.length === initialCount) {
    return res.status(404).json({ success: false, message: "Result record not found." });
  }
  saveDB(db);
  logAction(req.ip || "", "DELETE", `Deleted result record ID ${resultId}`);
  res.json({ success: true, message: "Result record deleted." });
});

// 8. SYSTEM LOGS
app.get("/api/logs", (req, res) => {
  const db = getDB();
  res.json({ system_logs: db.system_logs });
});

// 9. RECENT UPLOAD LOGS
app.get("/api/upload-logs", (req, res) => {
  const db = getDB();
  res.json(db.upload_logs);
});

// 10. INTELLIGENT CSV UPLOADER WITH STRICT RULES
// Receives CSV text, parses it, applies:
// - Alternate Student ID support or alternate student Name
// - Auto-creates missing students (and auto-generates email client-side style: ID@neub.edu.bd)
// - Auto-creates missing courses
// - Smart student Name update: If student exists and name is "Unknown", updates to the real CSV name
// - Composite duplicate prevention: Uses (student_id, course_id, semester, passing_year)
app.post("/api/results/upload", (req, res) => {
  const { csvText, semester, year, departmentId, keyField, originalFilename, username } = req.body;

  if (!csvText || !semester || !year || !departmentId || !keyField) {
    return res.status(400).json({ success: false, message: "Required parameters missing." });
  }

  const db = getDB();
  const parsedRows = parseCSV(csvText);

  if (parsedRows.length <= 1) {
    return res.status(400).json({ success: false, message: "CSV contains no data." });
  }

  // Headers check (case-insensitive column mapping)
  const headers = parsedRows[0].map(h => h.toLowerCase());
  
  // Find indices for standard fields
  // Support both ID and Name lookup
  const stdIdIdx = headers.findIndex(h => h.includes("student") && h.includes("id") || h === "studentid" || h === "id");
  const nameIdx = headers.findIndex(h => h.includes("name") || h === "studentname" || h === "fullname" || h === "student_name");
  const courseCodeIdx = headers.findIndex(h => h.includes("course") && h.includes("code") || h === "coursecode" || h === "code" || h === "subjectcode");
  const courseTitleIdx = headers.findIndex(h => h.includes("course") && h.includes("title") || h === "coursetitle" || h === "title" || h === "subjecttitle");
  const creditIdx = headers.findIndex(h => h.includes("credit") || h === "credit_hours");
  const ecrIdx = headers.findIndex(h => h.includes("ecr") || h === "effective_credit" || h === "effectivecredit");
  const gradeIdx = headers.findIndex(h => h.includes("grade") && h.includes("letter") || h === "grade" || h === "lettergrade");
  const pointIdx = headers.findIndex(h => h.includes("point") || h === "gradepoint" || h === "point" || h === "gpa" || h === "gp");
  const remarksIdx = headers.findIndex(h => h.includes("remarks") || h === "remark" || h.includes("remarks_exam") || h.includes("remarks_cr"));

  // Check if we have the absolute minimum required columns (identifier and course identifier)
  const identifierMissing = keyField === "id" ? stdIdIdx === -1 : nameIdx === -1;
  if (identifierMissing || courseCodeIdx === -1) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid CSV format. Missing essential columns. Required: ${keyField === "id" ? "Student ID" : "Student Name"} and Course Code (Found headers: [${parsedRows[0].join(", ")}])` 
    });
  }

  let studentsCreated = 0;
  let studentsUpdated = 0;
  let coursesCreated = 0;
  let resultsCreated = 0;
  let skippedDuplicates = 0;
  let failuresList: string[] = [];

  const targetDeptId = Number(departmentId);
  const passingYearInt = Number(year);

  // Database transactions mockup using simple loop
  for (let r = 1; r < parsedRows.length; r++) {
    const row = parsedRows[r];
    // skip empty rows
    if (row.length === 0 || row.join("").trim() === "") continue;

    try {
      const csvStdId = stdIdIdx !== -1 ? row[stdIdIdx] : "";
      const csvName = nameIdx !== -1 ? row[nameIdx] : "";
      const csvCourseCode = row[courseCodeIdx];
      const csvCourseTitle = courseTitleIdx !== -1 && row[courseTitleIdx] ? row[courseTitleIdx] : `Course ${csvCourseCode}`;
      const csvCredit = creditIdx !== -1 && row[creditIdx] ? Number(row[creditIdx]) : 3;
      const csvEcr = ecrIdx !== -1 && row[ecrIdx] ? Number(row[ecrIdx]) : csvCredit;
      const csvGrade = gradeIdx !== -1 && row[gradeIdx] ? row[gradeIdx] : "A";
      const csvPoint = pointIdx !== -1 && row[pointIdx] ? Number(row[pointIdx]) : 4.0;
      const csvRemarks = remarksIdx !== -1 && row[remarksIdx] ? row[remarksIdx] : "";

      if (!csvCourseCode) {
        failuresList.push(`Row ${r + 1}: Missing Course Code`);
        continue;
      }

      // Step 1: Find or Auto-Create Student
      let student: Student | undefined;

      if (keyField === "id") {
        // ID based lookup
        if (!csvStdId) {
          failuresList.push(`Row ${r + 1}: Missing Student ID (Key Field is set to ID)`);
          continue;
        }
        student = db.students.find(s => s.student_id === csvStdId);
        
        if (!student) {
          // Auto create missing student
          const sidStr = String(csvStdId).trim();
          const defaultPasswordHash = hashPassword("DefaultP12!");

          student = {
            id: db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1,
            student_id: csvStdId,
            name: csvName || "Unknown",
            email: `${csvStdId.toLowerCase()}@neub.edu.bd`,
            department_id: targetDeptId,
            password_hash: defaultPasswordHash,
            key_field: "id"
          };
          db.students.push(student);
          studentsCreated++;
        } else if (student.name === "Unknown" && csvName) {
          // Smart student name update
          student.name = csvName;
          studentsUpdated++;
        }
      } else {
        // Name based lookup
        if (!csvName) {
          failuresList.push(`Row ${r + 1}: Missing Student Name (Key Field is set to Name)`);
          continue;
        }
        student = db.students.find(s => s.name.toUpperCase() === csvName.toUpperCase());

        if (!student) {
          // Generate an ID for name lookup
          const generatedId = `NAME${Math.floor(100000 + Math.random() * 900000)}`;
          const finalId = csvStdId || generatedId;
          const sidStr = String(finalId).trim();
          const defaultPasswordHash = hashPassword("DefaultP12!");

          student = {
            id: db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1,
            student_id: finalId,
            name: csvName,
            email: `${csvName.replace(/\s+/g, '.').toLowerCase()}@neub.edu.bd`,
            department_id: targetDeptId,
            password_hash: defaultPasswordHash,
            key_field: "name",
            alternate_id: csvStdId || undefined
          };
          db.students.push(student);
          studentsCreated++;
        } else if (csvStdId && !student.student_id.startsWith("NAME")) {
          // If we have alternative/corrected Student ID
          student.alternate_id = csvStdId;
        }
      }

      // Step 2: Find or Auto-Create Course
      let course = db.courses.find(c => c.code.toUpperCase() === csvCourseCode.toUpperCase());
      if (!course) {
        const faculties = [
          "Prof. Dr. Syed Rahman",
          "Associate Prof. Md. Tariqul Islam",
          "Assistant Prof. Samia Chowdhury",
          "Dr. S. M. Kamal",
          "Lecturer Anika Tabassum",
          "Prof. Dr. Shakil Ahmed",
          "Assistant Prof. Nusrat Jahan"
        ];
        const randomTeacher = faculties[Math.abs(csvCourseCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % faculties.length];
        course = {
          id: db.courses.length > 0 ? Math.max(...db.courses.map(c => c.id)) + 1 : 1,
          code: csvCourseCode.toUpperCase(),
          title: csvCourseTitle,
          credit: csvCredit,
          ecr: csvEcr,
          teacher: randomTeacher
        };
        db.courses.push(course);
        coursesCreated++;
      }

      // Step 3: Insert / Avoid Duplicate Results using Composite Key
      const resultsDuplicate = db.results.some(resRecord => 
        resRecord.student_id === student!.id && 
        resRecord.course_id === course!.id && 
        resRecord.semester === semester && 
        resRecord.passing_year === passingYearInt
      );

      if (resultsDuplicate) {
        skippedDuplicates++;
      } else {
        const newResult: Result = {
          id: db.results.length > 0 ? Math.max(...db.results.map(resRecord => resRecord.id)) + 1 : 1,
          student_id: student.id,
          course_id: course.id,
          letter_grade: csvGrade,
          grade_point: isNaN(csvPoint) ? null : csvPoint,
          remarks: csvRemarks,
          semester: semester,
          passing_year: passingYearInt
        };
        db.results.push(newResult);
        resultsCreated++;
      }
    } catch (err: any) {
      failuresList.push(`Row ${r + 1}: Parsing exception - ${err.message}`);
    }
  }

  // Create Upload Log Entry
  const hasErrors = failuresList.length > 0;
  const status = hasErrors ? (resultsCreated > 0 ? "completed_with_errors" : "failed") : "completed";
  
  const uploadLog: UploadLog = {
    id: db.upload_logs.length > 0 ? Math.max(...db.upload_logs.map(log => log.id)) + 1 : 1,
    filename: originalFilename || "Uploaded_File.csv",
    original_name: originalFilename || "Uploaded_File.csv",
    semester: semester,
    year: passingYearInt,
    department: db.departments.find(d => d.id === targetDeptId)?.code || "N/A",
    status,
    students_imported: studentsCreated,
    courses_imported: coursesCreated,
    results_imported: resultsCreated,
    error_message: hasErrors ? failuresList.join(" | ") : undefined,
    uploaded_by: username || "saklan",
    created_at: new Date().toISOString()
  };

  db.upload_logs.unshift(uploadLog);
  saveDB(db);

  logAction(
    username || "saklan", 
    "POST", 
    `Results bulk upload: ${uploadLog.filename}. Results: ${resultsCreated}, Students created: ${studentsCreated}, Courses created: ${coursesCreated}, Status: ${status}`
  );

  res.json({
    success: status !== "failed",
    status,
    students_created: studentsCreated,
    students_updated: studentsUpdated,
    courses_created: coursesCreated,
    results_created: resultsCreated,
    skipped_duplicates: skippedDuplicates,
    errors_count: failuresList.length,
    errors: failuresList.slice(0, 50) // Return only first 50 errors for display clarity
  });
});

// 11. FLEXIBLE CSV FIELD MAPPER & IMPORT
app.post("/api/results/map-import", (req, res) => {
  const { 
    csvText, 
    mapping, 
    semester, 
    year, 
    departmentId,
    originalFilename,
    username
  } = req.body;

  if (!csvText || !mapping || !semester || !year || !departmentId) {
    return res.status(400).json({ success: false, message: "Required parameter details missing." });
  }

  const db = getDB();
  const parsedRows = parseCSV(csvText);

  if (parsedRows.length <= 1) {
    return res.status(400).json({ success: false, message: "CSV contains no data." });
  }

  // Extracted mapping config
  const colMap = mapping as Record<string, string>; // e.g. { "studentId": "StudentID" }
  const headers = parsedRows[0];

  const getIdxByMappedHeaderName = (mapperKey: string) => {
    const colName = colMap[mapperKey];
    if (!colName) return -1;
    return headers.findIndex(h => h.toUpperCase() === colName.toUpperCase());
  };

  const stdIdIdx = getIdxByMappedHeaderName("studentId");
  const nameIdx = getIdxByMappedHeaderName("name");
  const emailIdx = getIdxByMappedHeaderName("email");
  const courseCodeIdx = getIdxByMappedHeaderName("courseCode");
  const courseTitleIdx = getIdxByMappedHeaderName("courseTitle");
  const creditIdx = getIdxByMappedHeaderName("credit");
  const ecrIdx = getIdxByMappedHeaderName("ecr");
  const gradeIdx = getIdxByMappedHeaderName("grade");
  const pointIdx = getIdxByMappedHeaderName("point");
  const remarksIdx = getIdxByMappedHeaderName("remarks");

  if (stdIdIdx === -1 || nameIdx === -1 || courseCodeIdx === -1) {
    return res.status(400).json({ 
      success: false, 
      message: "Mapped config mapping error. Student ID, Name, and Course Code are required columns." 
    });
  }

  let studentsCreated = 0;
  let studentsUpdated = 0;
  let coursesCreated = 0;
  let resultsCreated = 0;
  let skippedDuplicates = 0;
  let failuresList: string[] = [];

  const targetDeptId = Number(departmentId);
  const passingYearInt = Number(year);

  for (let r = 1; r < parsedRows.length; r++) {
    const row = parsedRows[r];
    if (row.length === 0 || row.join("").trim() === "") continue;

    try {
      const csvStdId = row[stdIdIdx];
      const csvName = row[nameIdx];
      const csvEmail = emailIdx !== -1 ? row[emailIdx] : "";
      
      const csvCourseCode = row[courseCodeIdx];
      const csvCourseTitle = courseTitleIdx !== -1 && row[courseTitleIdx] ? row[courseTitleIdx] : `Course ${csvCourseCode}`;
      const csvCredit = creditIdx !== -1 && row[creditIdx] ? Number(row[creditIdx]) : 3;
      const csvEcr = ecrIdx !== -1 && row[ecrIdx] ? Number(row[ecrIdx]) : csvCredit;
      const csvGrade = gradeIdx !== -1 && row[gradeIdx] ? row[gradeIdx] : "A";
      const csvPoint = pointIdx !== -1 && row[pointIdx] ? Number(row[pointIdx]) : 4.0;
      const csvRemarks = remarksIdx !== -1 && row[remarksIdx] ? row[remarksIdx] : "";

      if (!csvStdId || !csvName || !csvCourseCode) {
        failuresList.push(`Row ${r + 1}: Required fields missing`);
        continue;
      }

      // Step 1: Find or Create Student with alternates checking
      let student = db.students.find(s => s.student_id === csvStdId);

      if (!student) {
        const sidStr = String(csvStdId).trim();
        const defaultPasswordHash = hashPassword("DefaultP12!");

        student = {
          id: db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1,
          student_id: csvStdId,
          name: csvName,
          email: csvEmail || `${csvStdId.toLowerCase()}@neub.edu.bd`,
          department_id: targetDeptId,
          password_hash: defaultPasswordHash,
          key_field: "id"
        };
        db.students.push(student);
        studentsCreated++;
      } else if (student.name === "Unknown" && csvName) {
        student.name = csvName;
        studentsUpdated++;
      }

      // Step 2: Course creation
      let course = db.courses.find(c => c.code.toUpperCase() === csvCourseCode.toUpperCase());
      if (!course) {
        const faculties = [
          "Prof. Dr. Syed Rahman",
          "Associate Prof. Md. Tariqul Islam",
          "Assistant Prof. Samia Chowdhury",
          "Dr. S. M. Kamal",
          "Lecturer Anika Tabassum",
          "Prof. Dr. Shakil Ahmed",
          "Assistant Prof. Nusrat Jahan"
        ];
        const randomTeacher = faculties[Math.abs(csvCourseCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % faculties.length];
        course = {
          id: db.courses.length > 0 ? Math.max(...db.courses.map(c => c.id)) + 1 : 1,
          code: csvCourseCode.toUpperCase(),
          title: csvCourseTitle,
          credit: csvCredit,
          ecr: csvEcr,
          teacher: randomTeacher
        };
        db.courses.push(course);
        coursesCreated++;
      }

      // Step 3: Composite uniqueness protection
      const resultsDuplicate = db.results.some(resRecord => 
        resRecord.student_id === student!.id && 
        resRecord.course_id === course!.id && 
        resRecord.semester === semester && 
        resRecord.passing_year === passingYearInt
      );

      if (resultsDuplicate) {
        skippedDuplicates++;
      } else {
        const newResult: Result = {
          id: db.results.length > 0 ? Math.max(...db.results.map(resRecord => resRecord.id)) + 1 : 1,
          student_id: student.id,
          course_id: course.id,
          letter_grade: csvGrade,
          grade_point: isNaN(csvPoint) ? null : csvPoint,
          remarks: csvRemarks,
          semester: semester,
          passing_year: passingYearInt
        };
        db.results.push(newResult);
        resultsCreated++;
      }
    } catch (err: any) {
      failuresList.push(`Row ${r + 1}: ${err.message}`);
    }
  }

  const hasErrors = failuresList.length > 0;
  const status = hasErrors ? (resultsCreated > 0 ? "completed_with_errors" : "failed") : "completed";
  
  const uploadLog: UploadLog = {
    id: db.upload_logs.length > 0 ? Math.max(...db.upload_logs.map(log => log.id)) + 1 : 1,
    filename: originalFilename || "Mapped_Upload.csv",
    original_name: originalFilename || "Mapped_Upload.csv",
    semester: semester,
    year: passingYearInt,
    department: db.departments.find(d => d.id === targetDeptId)?.code || "N/A",
    status,
    students_imported: studentsCreated,
    courses_imported: coursesCreated,
    results_imported: resultsCreated,
    error_message: hasErrors ? failuresList.join(" | ") : undefined,
    uploaded_by: username || "saklan",
    created_at: new Date().toISOString()
  };

  db.upload_logs.unshift(uploadLog);
  saveDB(db);

  logAction(
    username || "saklan", 
    "POST", 
    `Mapped Import: ${uploadLog.filename}. Results: ${resultsCreated}, Students created: ${studentsCreated}, Courses created: ${coursesCreated}, Status: ${status}`
  );

  res.json({
    success: status !== "failed",
    status,
    students_created: studentsCreated,
    students_updated: studentsUpdated,
    courses_created: coursesCreated,
    results_created: resultsCreated,
    skipped_duplicates: skippedDuplicates,
    errors_count: failuresList.length,
    errors: failuresList.slice(0, 50)
  });
});

// Admin config reset helper to clear databases
app.post("/api/admin/clear-database", (req, res) => {
  const db = getDB();
  db.students = [];
  db.results = [];
  db.courses = [];
  db.upload_logs = [];
  saveDB(db);
  logAction("127.0.0.1", "POST", "Database cleared successfully by administrative action");
  res.json({ success: true, message: "All students, courses, results, and upload history have been cleared successfully." });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static built files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEUB Result System] Server running on http://localhost:${PORT}`);
  });
}

startServer();
