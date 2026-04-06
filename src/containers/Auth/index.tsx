import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/store';
import logo from '../../assets/logo_primary.png';

// Import multi-step components
import VerifyPhoneStep from './components/VerifyPhoneStep';
import OtpStep from './components/OtpStep';
import VerifiedStep from './components/VerifiedStep';

const Auth = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Auth Mode: 'login' or 'signup'
    const [isLogin, setIsLogin] = useState(false);
    // Registration Steps: 'auth', 'verify-phone', 'otp', 'verified'
    const [step, setStep] = useState('auth');
    const [loading, setLoading] = useState(false);

    // Form Fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isSignupValid = emailRegex.test(email) && password.trim() !== '' && fullName.trim() !== '';
    const isLoginValid = emailRegex.test(email) && password.trim() !== '';

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulating API loading
        setTimeout(() => {
            setLoading(false);
            if (isLogin) {
                // Handle Login Success
                dispatch(login({ name: email.split('@')[0], email, role: 'candidate' }));
                navigate('/');
            } else {
                // Handle Signup Success
                setStep('verify-phone');
            }
        }, 1000);
    };

    const handlePhoneSuccess = () => setStep('otp');
    const handleOtpSuccess = () => {
        setStep('verified');
        setTimeout(() => {
            dispatch(login({
                name: fullName || 'User',
                email: email,
                role: 'candidate',
            }));
            navigate('/');
        }, 2000);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            {/* Left Side (Branding & Message) - Always visible, stacks on mobile */}
            <aside className="w-full lg:w-1/2 bg-[#FDF5E6] flex flex-col justify-center px-8 py-10 lg:py-0 lg:px-12 xl:px-24">
                {/* 
                   Mobile: Center align everything, smaller text/logo
                   Desktop: Original fixed layout (px-12 xl:px-24, h-100px logo)
                */}
                <div className="max-w-[540px] mx-auto lg:mx-0">
                    <div className="mb-4 lg:mb-1">
                        <Link to="/">
                            <img src={logo} alt="Meretium" className="h-[60px] lg:h-[100px] w-auto object-contain mx-auto lg:mx-0" />
                        </Link>
                    </div>
                    <div className="text-center lg:text-left">
                        <h1 className="text-[28px] lg:text-[36px] font-medium text-[#FF6934] leading-[36px] lg:leading-[48px] mb-3 capitalize tracking-normal" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            Manage Your Platform With Control & Clarity
                        </h1>
                        <p className="text-[14px] lg:text-[15px] xl:text-[16px] text-[#1D2939] font-medium leading-relaxed max-w-[440px] font-body mx-auto lg:mx-0">
                            Manage users, approvals, and platform health from one intelligent workspace.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Right Side (Forms) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-[#FFFFFF]">
                <div className="w-full flex justify-center py-4 sm:py-8 text-left">
                    {step === 'auth' && (
                        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px] lg:w-[480px] lg:h-[682px] flex flex-col justify-between overflow-hidden font-manrope transition-all duration-300">
                            <div>
                                <div className="text-center mb-6">
                                    <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#0A1124] tracking-tight leading-tight font-heading">
                                        Get Started With Meritium
                                    </h2>
                                    <p className="text-[#667085] text-[14px] mt-2 font-[400] font-body">Find roles that match your potential</p>
                                </div>

                                <div className="flex bg-[#F9FAFB] p-1.5 rounded-[10px] mb-6 border border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(false)}
                                        className={`flex-1 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all font-body cursor-pointer ${!isLogin ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#344054] hover:text-[#101828]'}`}
                                    >
                                        Sign Up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(true)}
                                        className={`flex-1 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all font-body cursor-pointer ${isLogin ? 'bg-[#FF6934] text-white shadow-sm' : 'text-[#344054] hover:text-[#101828]'}`}
                                    >
                                        Sign In
                                    </button>
                                </div>

                                <button className="w-full flex items-center justify-center gap-3 border border-[#D1D5DB] rounded-[8px] py-3 text-[14px] font-[600] text-[#344054] hover:bg-gray-50 transition-colors mb-6 cursor-pointer font-body">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                                    Continue with Google
                                </button>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-[#D1D5DB]"></div>
                                    <span className="text-[#667085] text-[14px] font-medium font-body">or</span>
                                    <div className="flex-1 h-px bg-[#D1D5DB]"></div>
                                </div>

                                <form onSubmit={handleAuthSubmit} className="space-y-4">
                                    {!isLogin && (
                                        <div>
                                            <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">Full name<span className="text-[#FF6934] ml-0.5">*</span></label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Enter your full name"
                                                className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">Email address<span className="text-[#FF6934] ml-0.5">*</span></label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[14px] font-regular text-[#344054] mb-1 font-body">Password<span className="text-[#FF6934] ml-0.5">*</span></label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 rounded-[8px] border border-[#D1D5DB] focus:border-[#FF6934] outline-none text-[16px] sm:text-[14px] transition-all placeholder:text-gray-400 text-gray-900 font-body"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || (isLogin ? !isLoginValid : !isSignupValid)}
                                        className="w-full bg-[#FF6934] hover:bg-[#E5552B] cursor-pointer text-white py-3 rounded-[8px] transition-all mt-2 text-[14px] font-[600] active:scale-[0.98] font-body disabled:opacity-70"
                                    >
                                        {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Create account')}
                                    </button>
                                </form>
                            </div>

                            <div className="text-center border-t border-gray-100 pt-6">
                                <p className="text-[12px] text-[#475467] font-body leading-tight">
                                    By continuing you agree to Meritium Terms & Privacy
                                </p>
                            </div>
                        </div>
                    )}
                    {step === 'verify-phone' && (
                        <VerifyPhoneStep onSuccess={handlePhoneSuccess} />
                    )}
                    {step === 'otp' && (
                        <OtpStep onSuccess={handleOtpSuccess} />
                    )}
                    {step === 'verified' && (
                        <VerifiedStep />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
