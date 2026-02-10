import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { FileText, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = "http://localhost:8001";

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTranscript, setSelectedTranscript] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/history`);
                const data = await res.json();
                setHistory(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-white mb-8">Attendance History</h1>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No history found.</td>
                                </tr>
                            )}
                            {history.map((record) => (
                                <tr key={record.id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 text-slate-300 font-mono">{record.date}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-white">{record.students?.name || record.student_roll}</div>
                                        <div className="text-xs text-slate-500">{record.student_roll}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'ABSENT'
                                                ? 'text-rose-400 bg-rose-500/10'
                                                : 'text-emerald-400 bg-emerald-500/10'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300 max-w-xs truncate" title={record.reason}>
                                        {record.reason || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        {record.transcript && (
                                            <button
                                                onClick={() => setSelectedTranscript(record)}
                                                className="text-primary-400 hover:text-primary-300 flex items-center gap-1 ml-auto text-xs"
                                            >
                                                <FileText size={14} /> View Log
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transcript Modal - Reused Logic */}
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
                                    <p className="text-slate-400 text-sm">Student: {selectedTranscript.students?.name}</p>
                                </div>
                                <button onClick={() => setSelectedTranscript(null)} className="text-slate-500 hover:text-white">
                                    <UserX size={20} className="rotate-45" />
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
        </Layout>
    );
};

export default History;
