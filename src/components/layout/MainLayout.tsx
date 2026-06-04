import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import AIChatModal from '../common/AIChatModal';
import { useAuth } from '../../context/AuthContext';
import { ChevronUp, Phone, X, Headphones } from 'lucide-react';

// Collapsible FAB Menu Component
interface ContactFabMenuProps {
    onChatOpen: () => void;
}

const ContactFabMenu: React.FC<ContactFabMenuProps> = ({ onChatOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const phoneNumber = '0901234567'; // Thay bằng số hotline thật
    const zaloLink = 'https://zalo.me/0901234567'; // Thay bằng link Zalo thật

    const menuItems = [
        {
            id: 'ai',
            icon: <img src="/idea-bulb.png" alt="AI" className="w-6 h-6 object-contain" />,
            label: 'Chat AI',
            color: 'bg-amber-500',
            shadowColor: 'shadow-amber-500/30',
            onClick: () => {
                onChatOpen();
                setIsOpen(false);
            },
        },
        {
            id: 'phone',
            icon: <Phone size={20} />,
            label: 'Hotline',
            color: 'bg-green-500',
            shadowColor: 'shadow-green-500/30',
            onClick: () => {
                window.location.href = `tel:${phoneNumber}`;
                setIsOpen(false);
            },
        },
        {
            id: 'zalo',
            icon: <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png" alt="Zalo" className="w-6 h-6 object-contain" />,
            label: 'Zalo',
            color: 'bg-blue-500',
            shadowColor: 'shadow-blue-500/30',
            onClick: () => {
                window.open(zaloLink, '_blank');
                setIsOpen(false);
            },
        },
    ];

    return (
        <div className="fixed bottom-20 right-5 z-40">
            {/* Menu Items - Expand to the left */}
            <div className={`flex flex-row-reverse items-center gap-3 absolute right-full mr-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                {menuItems.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        {/* Button */}
                        <button
                            onClick={item.onClick}
                            className={`w-12 h-12 ${item.color} text-white rounded-full flex items-center justify-center shadow-lg ${item.shadowColor} hover:scale-110 active:scale-95 transition-all border-2 border-white`}
                        >
                            {item.icon}
                        </button>
                        {/* Label below button */}
                        <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-[10px] font-bold shadow-md border border-gray-100 whitespace-nowrap">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border-2 border-white ${
                    isOpen 
                        ? 'bg-gray-800 rotate-45 shadow-gray-800/30' 
                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 hover:scale-105'
                }`}
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Headphones size={24} className="text-white" />
                )}
            </button>
        </div>
    );
};

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Scroll to top logic
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const location = useLocation();
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const isAiChatPage = location.pathname === '/ai-chat';
    const isLessonPlayer = location.pathname.includes('/lesson/');
    const isMyLearning = location.pathname === '/my-learning';
    const isCourseDashboard = location.pathname.includes('/course/') && location.pathname.includes('/dashboard');
    const showFooter = !isLoggedIn && !isAiChatPage && !isLessonPlayer && !isMyLearning && !isCourseDashboard;
    const showChatAndScroll = !isAiChatPage && !isLessonPlayer && !isMyLearning && !isCourseDashboard;

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#FDF8EE]">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed on desktop, hidden on mobile */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden">
                    <Outlet />
                </main>
                {showFooter && <Footer />}
            </div>
            
            {/* AI Assistant */}
            {showChatAndScroll && (
                <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            )}

            {showChatAndScroll && (
                <>
                    {/* Collapsible Contact FAB Menu */}
                    <ContactFabMenu onChatOpen={() => setIsChatOpen(true)} />

                    {/* Scroll to top button */}
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 z-30 group"
                        >
                            <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
                            <div className="relative w-12 h-12 bg-blue-500/50 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                                <ChevronUp size={20} />
                            </div>
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default MainLayout;
