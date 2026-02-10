import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files for dashboard

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Serve Dashboard
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Fetch Students
app.get("/students", async (req, res) => {
    const { data, error } = await supabase.from("students").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Submit Attendance
app.post("/submit-attendance", async (req, res) => {
    try {
        console.log("Received attendance submission:", req.body);
        const { present_students } = req.body;
        const date = new Date().toISOString().split("T")[0];

        // Get all students
        const { data: students, error } = await supabase.from("students").select("*");
        if (error) {
            console.error("Error fetching students:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`Found ${students.length} students in DB`);

        if (students.length === 0) {
            console.warn("No students found in DB. Did you run schema.sql?");
        }

        const attendanceRecords = [];

        for (let s of students) {
            const isPresent = present_students.includes(s.roll);
            const status = isPresent ? "PRESENT" : "ABSENT";

            // Push to DB record list
            attendanceRecords.push({
                student_roll: s.roll,
                status: status,
                date: date,
                reason: isPresent ? "" : "Pending Call..."
            });

            // If Absent, Trigger Call
            if (!isPresent) {
                triggerCall(s);
            }
        }

        console.log("Upserting records:", attendanceRecords);

        // Upsert into Supabase
        const { error: insertError } = await supabase
            .from("attendance")
            .upsert(attendanceRecords, { onConflict: "student_roll, date" });

        if (insertError) {
            console.error("Supabase Upsert Error:", insertError);
            return res.status(500).json({ error: insertError.message });
        }

        console.log("Attendance marked successfully");
        res.json({ success: true });
    } catch (err) {
        console.error("Unexpected error in /submit-attendance:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/attendance-log", async (req, res) => {
    const date = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

async function triggerCall(student) {
    try {
        await fetch("http://localhost:8000/start-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: student.phone,
                roll: student.roll
            })
        });
        console.log(`Call triggered for ${student.name}`);
    } catch (e) {
        console.error("Failed to trigger call service:", e);
    }
}

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
