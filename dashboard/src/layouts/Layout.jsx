import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileNav from '../components/MobileNav';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-transparent">
            <Sidebar />
            <Navbar />
            <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 md:pl-72 min-h-screen transition-all duration-300">
                {children}
            </main>
            <MobileNav />
        </div>
    );
};

export default Layout;
