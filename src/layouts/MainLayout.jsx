import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Calendar, Building, Home, Menu, Bell, Users, LogOut, Activity, Sun, Moon, MapPin, Box, FileText, ChevronDown, ChevronRight, Settings, CheckCheck, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { logout } from '../features/auth/services/apiAuth';
import { fetchNotifications, markAsRead } from '../features/notifications/services/apiNotifications';
import { getPendingUserTags, getAllDocs } from '../features/docs/services/apiDocs';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [pendingDocsCount, setPendingDocsCount] = useState(0);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [openMenus, setOpenMenus] = useState({});

    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [location, isMobile]);

    const loadNotifications = async () => {
        if (user?.profile?.id) {
            const [notifData, docsTagsData, docsData] = await Promise.all([
                fetchNotifications(),
                getPendingUserTags(user.profile.id),
                getAllDocs()
            ]);
            
            const pendingTags = docsTagsData.data || [];
            const allDocs = docsData.data || [];
            
            const docNotifs = pendingTags.map(tag => {
                const doc = allDocs.find(d => d.id === tag.doc_id);
                return {
                    id: `doc-tag-${tag.id}`,
                    title: 'Tanda Tangan Dibutuhkan',
                    message: `Dokumen "${doc ? doc.title : 'Unknown'}" menunggu tanda tangan Anda.`,
                    is_read: false,
                    link: '/docs',
                    type: 'doc'
                };
            });
            
            // Assuming regular notifications use entity_id for linking to /events
            const regularNotifs = (notifData || []).map(n => ({
                ...n,
                link: n.entity_id ? '/events' : null,
                type: 'regular'
            }));

            setNotifications([...regularNotifs, ...docNotifs]);
            setPendingDocsCount(pendingTags.length);
        }
    };

    const handleMarkAsRead = async (id, link, type) => {
        // If clicking the whole notification, we mark it and navigate
        if (type !== 'doc') {
            await markAsRead(id);
        }
        setShowNotifications(false);
        if (link) navigate(link);
        if (type !== 'doc') {
            loadNotifications();
        }
    };

    const handleMarkSingleAsRead = async (e, id, type) => {
        e.stopPropagation(); // prevent navigation
        if (type === 'doc') {
            toast.error('Selesaikan tanda tangan pada dokumen untuk menghilangkan notifikasi ini.', {
                icon: '✍️',
            });
            return;
        }
        await markAsRead(id);
        loadNotifications();
    };

    const handleMarkAllAsRead = async () => {
        const unreadRegular = notifications.filter(n => !n.is_read && n.type !== 'doc');
        if (unreadRegular.length > 0) {
            await Promise.all(unreadRegular.map(n => markAsRead(n.id)));
            loadNotifications();
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        document.title = unreadCount > 0 ? `(${unreadCount}) GARDA` : 'GARDA';
    }, [unreadCount]);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/events', label: 'Calendar of Event', icon: Calendar, badge: unreadCount },
        {
            id: 'building',
            label: 'Building',
            icon: Building,
            subMenu: [
                { path: '/mess', label: 'Mess & Akomodasi' }
            ]
        },
        { path: '/travel', label: 'Travel & Transport', icon: MapPin },
        { path: '/asset', label: 'Asset', icon: Box },
        { path: '/docs', label: 'Docs', icon: FileText, badge: pendingDocsCount },
    ];

    if (user?.profile?.role === 'Super Admin') {
        navItems.push({
            id: 'admin',
            label: 'Administrator',
            icon: Settings,
            subMenu: [
                { path: '/admin/employees', label: 'Data Karyawan', icon: Users },
                { path: '/admin/logs', label: 'Log Sistem', icon: Activity }
            ]
        });
    }

    const toggleSubMenu = (id) => {
        setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
        if (!isSidebarOpen) setIsSidebarOpen(true);
    };

    return (
        <div className="flex h-screen overflow-hidden p-4 gap-4 relative">
            {/* Mobile Backdrop */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`glass-card flex flex-col transition-all duration-300 p-4 z-50
        ${isMobile ? 'fixed inset-y-4 left-4' : 'relative'} 
        ${isSidebarOpen ? 'w-64 translate-x-0' : (isMobile ? '-translate-x-[150%] w-64' : 'w-20 translate-x-0')}
      `}>
                <div className="flex items-center justify-between mb-8">
                    {isSidebarOpen && <h1 className="text-xl font-bold text-primary truncate ml-3">GA Core</h1>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                        <Menu size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const hasSubMenu = !!item.subMenu;

                        // Check if active (including if one of sub menu is active)
                        let isActive = false;
                        if (item.path) {
                            isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        } else if (hasSubMenu) {
                            isActive = item.subMenu.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path));
                        }

                        const Icon = item.icon;

                        return (
                            <div key={item.id || item.path} className="flex flex-col">
                                {hasSubMenu ? (
                                    <button
                                        onClick={() => toggleSubMenu(item.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-white/60 dark:bg-slate-800/60 shadow-sm text-primary font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                                    >
                                        <div className="flex items-center">
                                            <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'} />
                                            {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                                        </div>
                                        {isSidebarOpen && (
                                            openMenus[item.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-white/60 dark:bg-slate-800/60 shadow-sm text-primary font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                                    >
                                        <div className="flex items-center">
                                            <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'} />
                                            {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                                        </div>
                                        {item.badge > 0 && isSidebarOpen && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                                        )}
                                        {item.badge > 0 && !isSidebarOpen && (
                                            <span className="absolute ml-6 mt-[-10px] w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                        )}
                                    </Link>
                                )}

                                {/* Sub Menu Content */}
                                {hasSubMenu && isSidebarOpen && openMenus[item.id] && (
                                    <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-700/50 pl-3 animate-slide-in-up animate-fade-in">
                                        {item.subMenu.map((sub) => {
                                            const isSubActive = location.pathname === sub.path || location.pathname.startsWith(sub.path);
                                            const SubIcon = sub.icon;
                                            return (
                                                <Link
                                                    key={sub.path}
                                                    to={sub.path}
                                                    className={`flex items-center p-2 rounded-lg text-sm transition-all ${isSubActive ? 'bg-primary/5 text-primary font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                                                >
                                                    {SubIcon && <SubIcon size={16} className="mr-2 opacity-70" />}
                                                    <span className="truncate">{sub.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="glass-card mb-4 p-4 flex items-center justify-between relative z-30">
                    <div className="flex items-center gap-3">
                        {isMobile && !isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <Menu size={24} className="text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                        <h2 className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-100 truncate max-w-[150px] sm:max-w-xs">
                            {navItems.find(i => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path)))?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none flex items-center px-1 shadow-inner overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-sky-200'}`}
                            title="Toggle Dark Mode"
                        >
                            <div className={`absolute w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm transform transition-transform duration-500 flex items-center justify-center z-10 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
                                {isDark ? <Moon size={14} className="text-slate-700 dark:text-slate-200" /> : <Sun size={14} className="text-amber-500" />}
                            </div>
                            {/* Decorative background icons */}
                            <div className="absolute inset-0 flex justify-between items-center px-2 opacity-50">
                                <Sun size={12} className="text-amber-600" />
                                <Moon size={12} className="text-slate-300" />
                            </div>
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            {showNotifications && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                            )}
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors relative z-50">
                                <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 md:w-80 glass-card bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden animate-slide-in-down animate-fade-in">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">Notifikasi</span>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} baru</span>}
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllAsRead} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-primary transition-colors" title="Tandai semua selesai">
                                                    <CheckCheck size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto bg-white dark:bg-slate-800">
                                        {notifications.filter(n => !n.is_read).length === 0 ? (
                                            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada notifikasi baru</p>
                                        ) : notifications.filter(n => !n.is_read).map(notif => (
                                            <div key={notif.id} onClick={() => handleMarkAsRead(notif.id, notif.link, notif.type)} className={`p-3 border-b border-slate-50 dark:border-slate-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 dark:hover:bg-slate-700/50 bg-primary/5`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{notif.title}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleMarkSingleAsRead(e, notif.id, notif.type)}
                                                        className="p-1 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-full transition-colors flex-shrink-0"
                                                        title="Tandai Selesai"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700/50 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.profile?.nama_lengkap || user?.email}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.profile?.role || 'Karyawan'}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                {user?.profile?.nama_lengkap ? user.profile.nama_lengkap.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <button onClick={handleLogout} className="p-2 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto rounded-2xl pb-4">
                    <Outlet context={{ notifications, loadNotifications }} />
                </main>
            </div>
        </div>
    );
}
