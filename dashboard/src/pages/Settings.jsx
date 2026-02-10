import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import { PhoneOutgoing, CircuitBoard } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const Settings = () => {
    const [testNumber, setTestNumber] = useState("");
    const [calling, setCalling] = useState(false);

    const handleTestCall = async (e) => {
        e.preventDefault();
        setCalling(true);
        try {
            const res = await fetch(`${API_URL}/start-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: testNumber,
                    roll: 'TEST-001'
                })
            });
            if (res.ok) {
                alert("Test call initiated!");
            } else {
                alert("Failed to start call");
            }
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setCalling(false);
        }
    }

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="grid gap-6 max-w-2xl">
                {/* AI Config */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <CircuitBoard />
                        <h2 className="text-xl font-bold text-white">System Status</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 uppercase">AI Model</p>
                            <p className="text-white font-mono mt-1">gemini-2.0-flash-exp</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 uppercase">Voice Engine</p>
                            <p className="text-white font-mono mt-1">Piper TTS</p>
                        </div>
                    </div>
                </div>

                {/* Test Call */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4 text-amber-400">
                        <PhoneOutgoing />
                        <h2 className="text-xl font-bold text-white">Test Voice Agent</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                        Enter a phone number to simulate an absence call. The AI will treat this as a mock student (TEST-001).
                    </p>
                    <form onSubmit={handleTestCall} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="+91..."
                            className="glass-input flex-1"
                            value={testNumber}
                            onChange={(e) => setTestNumber(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={calling}
                            className="btn-primary whitespace-nowrap px-6"
                        >
                            {calling ? "Calling..." : "Call Now"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
