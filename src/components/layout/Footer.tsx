    import React from 'react';
    import { NavLink } from 'react-router-dom';
    import {
        Facebook,
        Youtube,
        Globe,
        Mail,
        Phone,
        MapPin,
        ArrowRight,
        Instagram,
        Send
    } from 'lucide-react';

    const Footer: React.FC = () => {
        return (
            <footer className="bg-white border-t border-gray-100">
                {/* Newsletter Section */}
                <div className="bg-slate-900 py-12">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-white">
                            <h3 className="text-2xl md:text-3xl font-bold mb-2">Đăng ký nhận bản tin</h3>
                            <p className="text-white/70">Cập nhật khóa học mới và ưu đãi đặc biệt.</p>
                        </div>
                        <div className="w-full md:max-w-md">
                            <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Nhập email của bạn..."
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 px-6 py-4 rounded-full outline-none focus:bg-white/15 focus:border-white/30 transition-all pr-14"
                                />
                                <button className="absolute right-1.5 w-11 h-11 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all cursor-pointer">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {/* Brand Section */}
                        <div className="space-y-5">
                            <NavLink to="/" className="flex items-center gap-3">
                                <img src='/idea-bulb.png' alt="Logo" className="w-9 h-auto object-contain" />
                                <span className="text-xl font-bold text-gray-800">E-Learning</span>
                            </NavLink>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                Nền tảng học trực tuyến hiện đại, cung cấp khóa học chất lượng từ các chuyên gia hàng đầu.
                            </p>
                            <div className="flex items-center gap-3">
                                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                                    <Facebook size={16} />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                                    <Youtube size={16} />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all">
                                    <Instagram size={16} />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-slate-800 hover:text-white transition-all">
                                    <Globe size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-gray-900 font-bold mb-5">Khám phá</h4>
                            <ul className="space-y-3">
                                <li>
                                    <NavLink to="/courses" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Khóa học
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/categories" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Danh mục
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/about" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Về chúng tôi
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/blog" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Blog
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-gray-900 font-bold mb-5">Hỗ trợ</h4>
                            <ul className="space-y-3">
                                <li>
                                    <NavLink to="/faq" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Câu hỏi thường gặp
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/policy" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Chính sách bảo mật
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/terms" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Điều khoản sử dụng
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/contact" className="text-gray-500 hover:text-amber-600 transition-colors text-sm flex items-center gap-2 group">
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Liên hệ
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-gray-900 font-bold mb-5">Liên hệ</h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-gray-500 text-sm leading-relaxed">TP. Hồ Chí Minh, Việt Nam</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-gray-500 text-sm">0981975303</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-gray-500 text-sm">support@elearning.vn</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-gray-400 text-sm">
                            &copy; 2026 E-Learning. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <NavLink to="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Chính sách riêng tư</NavLink>
                            <NavLink to="/terms" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Điều khoản dịch vụ</NavLink>
                        </div>
                    </div>
                </div>
            </footer>
        );
    };

    export default Footer;
