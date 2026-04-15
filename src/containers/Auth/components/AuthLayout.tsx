import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo_primary.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  rightPanelClassName?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, rightPanelClassName = 'bg-[#FFFFFF]' }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      <aside className="w-full lg:w-1/2 bg-[#FDF5E6] flex flex-col justify-center px-8 py-10 lg:py-0 lg:px-12 xl:px-24">
        <div className="max-w-[540px] mx-auto lg:mx-0">
          <div className="mb-4 lg:mb-1">
            <Link to="/">
              <img src={logo} alt="Meretium" className="h-[60px] lg:h-[100px] w-auto object-contain mx-auto lg:mx-0" />
            </Link>
          </div>
          <div className="text-center lg:text-left">
            <h1
              className="text-[28px] lg:text-[36px] font-medium text-[#FF6934] leading-[36px] lg:leading-[48px] mb-3 capitalize tracking-normal"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Manage Your Platform With Control &amp; Clarity
            </h1>
            <p className="text-[14px] lg:text-[15px] xl:text-[16px] text-[#1D2939] font-medium leading-relaxed max-w-[440px] font-body mx-auto lg:mx-0">
              Manage users, approvals, and platform health from one intelligent workspace.
            </p>
          </div>
        </div>
      </aside>

      <div className={`w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 ${rightPanelClassName}`}>
        <div className="w-full flex justify-center py-4 sm:py-8 text-left">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
