import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { Plus, Trash2, Search, User, Phone, Save, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = "http://localhost:8001";

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', roll: '', phone: '', parent_name: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_URL}/students`);
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewStudent({ name: '', roll: '', phone: '', parent_name: '' });
                fetchStudents();
            } else {
                alert("Failed to add student");
            }
        } catch (err) {
            alert("Error adding student");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (roll) => {
        if (!window.confirm(`Are you sure you want to delete student ${roll}?`)) return;
        try {
            const res = await fetch(`${API_URL}/students/${roll}`, { method: 'DELETE' });
            if (res.ok) {
                fetchStudents();
            } else {
                alert("Failed to delete");
            }
        } catch (err) {
            alert("Error deleting");
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Students</h1>
                    <p className="text-slate-400 mt-1">Manage class roster</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                >
                    <Plus size={20} />
                    Add Student
                </button>
            </div>

            {loading ? (
                <div className="text-white text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map(student => (
                        <div key={student.roll} className="glass-card p-5 group hover:border-primary-500/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {student.name.substring(0, 2).toUpperCase()}
                                </div>
                                <button
                                    onClick={() => handleDelete(student.roll)}
                                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-white/70">{student.roll}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <User size={14} />
                                    <span>Parent: {student.parent_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Phone size={14} />
                                    <span>{student.phone}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Student Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Add New Student</h3>
                                <button onClick={() => setIsAdding(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Full Name</label>
                                    <input
                                        required
                                        className="glass-input w-full"
                                        value={newStudent.name}
                                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Roll Number</label>
                                    <input
                                        required
                                        className="glass-input w-full"
                                        value={newStudent.roll}
                                        onChange={e => setNewStudent({ ...newStudent, roll: e.target.value })}
                                        placeholder="e.g. CS-101"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Parent Name</label>
                                    <input
                                        className="glass-input w-full"
                                        value={newStudent.parent_name}
                                        onChange={e => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                                        placeholder="e.g. Mr. Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Phone Number</label>
                                    <input
                                        required
                                        className="glass-input w-full"
                                        value={newStudent.phone}
                                        onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                                        placeholder="e.g. +919876543210"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full btn-primary py-3 flex justify-center items-center gap-2 mt-4"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    Save Student
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Students;
