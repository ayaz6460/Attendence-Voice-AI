import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import { Users, UserCheck, UserX, PhoneOutgoing, Filter, CheckCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// API Config
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const Dashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedTranscript, setSelectedTranscript] = useState(null);

    // Fetch Students on Mount
    React.useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_URL}/students`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            // Ensure status defaults to Present if not set
            const formatted = data.map(s => ({ ...s, status: s.status || "Present" }));
            setStudents(formatted);
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setLoading(false);
        }
    };

    // Derived Stats
    const totalStudents = students.length;
    const presentCount = students.filter(s => s.status === "Present").length;
    const absentCount = totalStudents - presentCount;

    // Toggle Status
    const toggleAttendance = (id) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === "Present" ? "Absent" : "Present" } : s
        ));
    };

    // Mark All
    const markAll = (status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    // Filter
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Submit Handler - Trigger Calls
    const handleSubmit = async () => {
        setIsSubmitting(true);
        const absentStudents = students.filter(s => s.status === "Absent");

        try {
            // Trigger calls sequentially or in parallel
            const promises = absentStudents.map(student =>
                fetch(`${API_URL}/start-call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: student.phone, // Ensure phone exists in DB
                        roll: student.roll
                    })
                })
            );

            await Promise.all(promises);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error("Error triggering calls:", err);
            alert("Failed to initiate calls. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Intro */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Today's Attendance</h1>
                    <p className="text-slate-400 mt-2">Manage student attendance for <span className="text-primary-500 font-semibold">Computer Science (CS-A)</span></p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Total Students" value={totalStudents} icon={Users} color="bg-blue-500" />
                    <StatsCard title="Present Today" value={presentCount} icon={UserCheck} color="bg-emerald-500" />
                    <StatsCard title="Absent Today" value={absentCount} icon={UserX} color="bg-rose-500" />
                    <StatsCard title="Calls Triggered" value={absentCount > 0 ? absentCount : 0} icon={PhoneOutgoing} color="bg-amber-500" />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or roll..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="glass-input w-full pl-10"
                            />
                        </div>
                        <button className="btn-ghost" title="Filter"><Filter size={20} /></button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => markAll("Present")} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider px-3 py-2 hover:bg-emerald-500/10 rounded-lg transition-colors">
                            Mark All Present
                        </button>
                        <div className="w-px h-6 bg-white/10 my-auto"></div>
                        <button onClick={() => markAll("Absent")} className="text-xs font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-wider px-3 py-2 hover:bg-rose-500/10 rounded-lg transition-colors">
                            Mark All Absent
                        </button>
                    </div>
                </div>

                {/* Student List */}
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {filteredStudents.map((student) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${student.status === "Present"
                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                                    : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${student.status === "Present" ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                                        }`}>
                                        {student.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono">{student.roll}</span>
                                            <span>•</span>
                                            <span>Parent: {student.parent}</span>
                                        </div>
                                        {/* Reason Display */}
                                        {student.status === "Absent" && student.reason && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-rose-300 text-xs font-medium bg-rose-500/10 px-2 py-0.5 rounded">
                                                    Reason: {student.reason}
                                                </span>
                                                {student.transcript && (
                                                    <button
                                                        onClick={() => setSelectedTranscript(student)}
                                                        className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2"
                                                    >
                                                        View Call Log
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${student.status === "Present" ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
                                        }`}>
                                        {student.status === "Present" ? "Present" : "Absent"}
                                    </span>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={student.status === "Present"}
                                            onChange={() => toggleAttendance(student.id)}
                                        />
                                        <div className="w-14 h-7 bg-rose-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Submit Action */}
                <div className="sticky bottom-6 z-30">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent -z-10 h-32 -top-20 pointer-events-none" />
                    <button
                        onClick={handleSubmit}
                        className="w-full btn-primary flex items-center justify-center gap-3 text-lg py-4 shadow-2xl shadow-emerald-500/20"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Submitting Attendance...
                            </>
                        ) : (
                            <>
                                <CheckCircle />
                                Submit Attendance & Notify Parents
                            </>
                        )}
                    </button>
                </div>

                {/* Success Modal (Toast overlay) */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 right-10 bg-emerald-500 text-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-emerald-400/30 backdrop-blur-md"
                        >
                            <div className="bg-white/20 p-2 rounded-full">
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Attendance Submitted!</h4>
                                <p className="text-emerald-100 text-sm">Automated calls initiated for absent students.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transcript Modal */}
                <AnimatePresence>
                    {selectedTranscript && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedTranscript(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Call Transcript</h3>
                                        <p className="text-slate-400 text-sm">for {selectedTranscript.name}</p>
                                    </div>
                                    <button onClick={() => setSelectedTranscript(null)} className="text-slate-500 hover:text-white">
                                        <UserX size={20} className="rotate-45" /> {/* Close icon hack using UserX */}
                                    </button>
                                </div>
                                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                                    {selectedTranscript.transcript ? selectedTranscript.transcript.split('\n').map((line, i) => {
                                        const isAI = line.startsWith('AI:');
                                        return (
                                            <div key={i} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isAI
                                                    ? 'bg-slate-800 text-slate-200 rounded-tl-none'
                                                    : 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 rounded-tr-none'}`}>
                                                    <span className="block text-xs opacity-50 mb-1">{isAI ? 'Priya (AI)' : 'Parent/Student'}</span>
                                                    {line.replace(/^(AI:|User:)\s*/, '')}
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <p className="text-center text-slate-500">No transcript available.</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

const StatsCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card p-6 flex items-start justify-between relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon size={80} />
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-4xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white shadow-lg`}>
            <Icon size={24} />
        </div>
    </div>
);

export default Dashboard;
