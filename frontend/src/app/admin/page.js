"use client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { refreshAdminSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("admin/login", { email, password });
            if (data.error === false) {
                toast({ title: "Welcome back!", description: "Redirecting to dashboard…" });
                localStorage.setItem("atoken", data.authtoken);
                await refreshAdminSession();
                router.push("/admin/dashboard");
            } else {
                toast({ title: "Access denied", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            const msg = error.response?.data?.msg || "An unexpected error occurred.";
            toast({ title: "Access denied", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .admin-root {
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #050505;
                    position: relative;
                    overflow: hidden;
                    padding: 24px 16px;
                }

                /* Ambient glow blobs */
                .admin-root::before {
                    content: '';
                    position: absolute;
                    top: -160px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(ellipse, rgba(239,68,68,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .admin-root::after {
                    content: '';
                    position: absolute;
                    bottom: -200px;
                    right: -100px;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%);
                    pointer-events: none;
                }

                .admin-card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 420px;
                    background: linear-gradient(145deg, #111111 0%, #0d0d0d 100%);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px;
                    padding: 40px 36px;
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.03),
                        0 40px 80px rgba(0,0,0,0.6),
                        0 0 60px rgba(239,68,68,0.05);
                }

                /* Shield icon */
                .shield-wrap {
                    width: 68px;
                    height: 68px;
                    border-radius: 18px;
                    background: linear-gradient(145deg, #dc2626, #991b1b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    box-shadow: 0 8px 32px rgba(239,68,68,0.35), 0 0 0 1px rgba(255,255,255,0.08);
                }

                /* Wordmark */
                .wordmark {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 20px;
                }
                .wordmark-one { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
                .wordmark-more { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
                .wordmark-gift { color: #ef4444; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
                .wordmark-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: #ef4444;
                    margin: 0 6px;
                }

                .admin-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    text-align: center;
                    margin: 0 0 6px;
                    letter-spacing: -0.3px;
                }
                .admin-sub {
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                    margin: 0 0 32px;
                }

                /* Divider */
                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                }
                .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
                .divider-text { font-size: 11px; color: #444; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }

                /* Form fields */
                .field-group { margin-bottom: 18px; }
                .field-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #aaa;
                    margin-bottom: 8px;
                    letter-spacing: 0.01em;
                }
                .field-wrap { position: relative; }
                .field-input {
                    width: 100%;
                    height: 48px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 15px;
                    font-family: inherit;
                    padding: 0 16px;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .field-input::placeholder { color: #444; }
                .field-input:focus {
                    border-color: rgba(239,68,68,0.5);
                    background: rgba(255,255,255,0.05);
                    box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
                }
                .field-input.has-icon { padding-right: 48px; }

                .toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #555;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.15s;
                    border-radius: 6px;
                }
                .toggle-btn:hover { color: #aaa; }

                /* Submit button */
                .submit-btn {
                    width: 100%;
                    height: 50px;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 15px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px rgba(239,68,68,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: 0.01em;
                }
                .submit-btn:hover:not(:disabled) {
                    opacity: 0.9;
                    box-shadow: 0 6px 28px rgba(239,68,68,0.4);
                    transform: translateY(-1px);
                }
                .submit-btn:active:not(:disabled) { transform: translateY(0); }
                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Footer */
                .secure-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 28px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .secure-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 6px rgba(34,197,94,0.6);
                    animation: pulse-green 2s infinite;
                }
                @keyframes pulse-green {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .secure-text { font-size: 12px; color: #555; font-weight: 500; }

                /* Spinner */
                .spinner {
                    width: 18px; height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="admin-root">
                <div className="admin-card">
                    {/* Shield icon */}
                    <div className="shield-wrap">
                        <Shield size={30} color="#fff" strokeWidth={2} />
                    </div>

                    {/* Wordmark */}
                    <div className="wordmark">
                        <span className="wordmark-one">One</span>
                        <span className="wordmark-more">More</span>
                        <span className="wordmark-gift">Gift</span>
                    </div>

                    <h1 className="admin-title">Admin Portal</h1>
                    <p className="admin-sub">Restricted access · Authorized personnel only</p>

                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">Sign in</span>
                        <div className="divider-line" />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="field-group">
                            <label htmlFor="email" className="field-label">Admin Email</label>
                            <div className="field-wrap">
                                <input
                                    id="email"
                                    type="email"
                                    className="field-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="field-group">
                            <label htmlFor="password" className="field-label">Password</label>
                            <div className="field-wrap">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="field-input has-icon"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? (
                                <><div className="spinner" /> Authenticating…</>
                            ) : (
                                <><Shield size={16} /> Access Dashboard</>
                            )}
                        </button>
                    </form>

                    <div className="secure-badge">
                        <div className="secure-dot" />
                        <span className="secure-text">End-to-end encrypted admin session</span>
                    </div>
                </div>
            </div>
        </>
    );
}
