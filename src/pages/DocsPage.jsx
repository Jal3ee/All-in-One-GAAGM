import React, { useState, useEffect, useRef } from 'react';
import { getAllDocs, getAllDocTags, createDoc, addDocTags, updateDocStatus, deleteDoc, replaceDocFile } from '../features/docs/services/apiDocs';
import { getAllEmployees } from '../features/admin/services/apiAdmin';
import { createSystemLog } from '../features/admin/services/apiLogs';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { FilePlus, Edit, Trash2, Download, CheckCircle, RefreshCw, Eye, ChevronDown } from 'lucide-react';
import PdfViewerModal from '../features/docs/components/PdfViewerModal';

// Helper component for Multi-Select Dropdown
function MultiSelectDropdown({ label, options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    return (
        <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
            <div 
                className="glass-input w-full flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate text-slate-600 dark:text-slate-300">
                    {selectedValues.length === 0 ? label : `${label} (${selectedValues.length})`}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
            </div>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {options.map(opt => (
                            <label key={opt.value} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors">
                                <input 
                                    type="checkbox"
                                    className="rounded text-primary focus:ring-primary h-4 w-4"
                                    checked={selectedValues.includes(opt.value)}
                                    onChange={() => toggleOption(opt.value)}
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{opt.label}</span>
                            </label>
                        ))}
                        {options.length === 0 && <div className="p-2 text-sm text-slate-500">Tidak ada data</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DocsPage() {
    const { user } = useAuth();
    const [docs, setDocs] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({ title: '', pic: [], tags: [], category: '' });

    // Create Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('RF');
    const [file, setFile] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [saving, setSaving] = useState(false);

    // Pdf Viewer State
    const [selectedDocForPdf, setSelectedDocForPdf] = useState(null);

    // Replace File State
    const replaceFileInputRef = useRef(null);
    const [replaceDoc, setReplaceDoc] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [docsRes, tagsRes, empRes] = await Promise.all([
            getAllDocs(),
            getAllDocTags(),
            getAllEmployees()
        ]);
        setDocs(docsRes.data || []);
        setAllTags(tagsRes.data || []);
        setEmployees(empRes.data || []);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!file) return alert('Pilih file PDF terlebih dahulu');
        
        setSaving(true);
        const docRes = await createDoc(title, user.profile.nama_lengkap, category, file);
        if (docRes.error) {
            alert('Gagal membuat dokumen: ' + docRes.error.message);
        } else {
            const newDocId = Array.isArray(docRes.data) ? docRes.data[0].id : docRes.data.id;
            if (selectedUsers.length > 0) {
                await addDocTags(newDocId, selectedUsers);
            }
            await createSystemLog('Buat Dokumen', `Membuat dokumen baru: ${title}`);
            setIsCreateModalOpen(false);
            setTitle(''); setFile(null); setSelectedUsers([]);
            loadData();
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (confirm('Yakin ingin menghapus dokumen ini?')) {
            await deleteDoc(id);
            await createSystemLog('Hapus Dokumen', `Menghapus dokumen ID: ${id}`);
            loadData();
        }
    };

    const handleCloseDoc = async (id) => {
        if (confirm('Yakin ingin menutup (close) dokumen ini? Dokumen akan dipindah ke Histori.')) {
            await updateDocStatus(id, 'Closed');
            await createSystemLog('Tutup Dokumen', `Menutup dokumen ID: ${id}`);
            loadData();
        }
    };

    const handleReplaceClick = (doc) => {
        setReplaceDoc(doc);
        if (replaceFileInputRef.current) {
            replaceFileInputRef.current.click();
        }
    };

    const handleReplaceFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !replaceDoc) return;
        
        setLoading(true);
        const res = await replaceDocFile(replaceDoc.id, replaceDoc.file_id, file);
        if (res.error) {
            alert("Gagal replace file: " + res.error.message);
        } else {
            await createSystemLog('Replace Dokumen', `Mengganti file untuk dokumen: ${replaceDoc.title}`);
            loadData();
        }
        setReplaceDoc(null);
        e.target.value = null; // reset
        setLoading(false);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.nama_lengkap : (id || 'Unknown');
    };

    // Filter logic
    const filteredDocs = docs.filter(doc => {
        if (activeTab === 'Pending' && doc.status !== 'Pending') return false;
        if (activeTab === 'Histori' && doc.status !== 'Closed') return false;
        
        if (filters.title && !doc.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
        
        if (filters.category && doc.category !== filters.category) return false;
        
        // Multi-select filter for PIC (Pembuat)
        // Note: Old data might have name instead of ID in `pic`. We check both.
        if (filters.pic.length > 0) {
            const matchesPic = filters.pic.includes(doc.pic);
            if (!matchesPic) return false;
        }

        // Multi-select filter for Orang Terlibat
        if (filters.tags.length > 0) {
            const docTags = allTags.filter(t => t.doc_id === doc.id).map(t => t.user_id);
            // Must include AT LEAST ONE of the selected filter tags
            const hasMatchingTag = filters.tags.some(tagUserId => docTags.includes(tagUserId));
            if (!hasMatchingTag) return false;
        }
        
        return true;
    });

    // Employee options for dropdowns
    // Since pic stores nama_lengkap, the PIC filter should use nama_lengkap as value
    const employeeOptionsForTags = employees.map(emp => ({ label: emp.nama_lengkap, value: emp.id }));
    const employeeOptionsForPic = employees.map(emp => ({ label: emp.nama_lengkap, value: emp.nama_lengkap }));

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Document Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola dan E-Sign dokumen secara online.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="glass-button flex items-center gap-2">
                    <FilePlus size={18} /> Dokumen Baru
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('Pending')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${activeTab === 'Pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Pending
                </button>
                <button 
                    onClick={() => setActiveTab('Histori')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${activeTab === 'Histori' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Histori
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input 
                    placeholder="Filter Nama Docs..." 
                    value={filters.title}
                    onChange={(e) => setFilters({...filters, title: e.target.value})}
                    className="glass-input flex-1 min-w-[200px]" 
                />
                
                <MultiSelectDropdown 
                    label="Filter Pembuat"
                    options={employeeOptionsForPic}
                    selectedValues={filters.pic}
                    onChange={(vals) => setFilters({...filters, pic: vals})}
                />

                <MultiSelectDropdown 
                    label="Filter Orang Terlibat"
                    options={employeeOptionsForTags}
                    selectedValues={filters.tags}
                    onChange={(vals) => setFilters({...filters, tags: vals})}
                />

                <select 
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="glass-input flex-1 min-w-[120px]"
                >
                    <option value="">Semua Kategori</option>
                    <option value="RF">RF</option>
                    <option value="PR">PR</option>
                    <option value="IM">IM</option>
                    <option value="LPJ">LPJ</option>
                </select>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-16">No</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Nama Docs</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Pembuat</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Orang Terlibat</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-32">Progress TTD</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td></tr>
                            ) : filteredDocs.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">Tidak ada dokumen ditemukan.</td></tr>
                            ) : filteredDocs.map((doc, index) => {
                                // Get tags for this doc
                                const docTags = allTags.filter(t => t.doc_id === doc.id);
                                // Remove duplicates just in case
                                const uniqueUsers = [...new Set(docTags.map(t => t.user_id))];

                                // Calculate progress
                                const parsedDocTags = docTags.map(t => {
                                    let config = {};
                                    try { config = JSON.parse(t.config || '{}'); } catch(e) {}
                                    return { ...t, ...config };
                                });
                                const signTags = parsedDocTags.filter(t => t.type === 'sign');
                                const totalSign = signTags.length;
                                const solvedSign = signTags.filter(t => t.status === 'solved').length;
                                const progressPercentage = totalSign > 0 ? Math.round((solvedSign / totalSign) * 100) : 0;

                                return (
                                <tr key={doc.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{index + 1}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-200">{doc.title}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-200">{getEmployeeName(doc.pic)}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md shadow-sm">
                                            {doc.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                        {uniqueUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {uniqueUsers.map(uid => (
                                                    <span key={uid} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                        {getEmployeeName(uid)}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4">
                                        {totalSign > 0 ? (
                                            <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    <span>{solvedSign}/{totalSign}</span>
                                                    <span>{progressPercentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all ${progressPercentage === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">Belum di-setup</span>
                                        )}
                                    </td>
                                    <td className="p-4 flex flex-wrap justify-center gap-2">
                                        <button 
                                            onClick={() => setSelectedDocForPdf(doc)}
                                            className="p-2 rounded-lg transition-colors border shadow-sm bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                            title="View / Edit PDF"
                                        >
                                            <Eye size={16} />
                                        </button>
                                            <a 
                                                href={doc.file_url} 
                                                target="_blank" rel="noreferrer"
                                                className="p-2 rounded-lg transition-colors border shadow-sm bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                            </a>
                                            {activeTab === 'Pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleReplaceClick(doc)}
                                                        className="p-2 rounded-lg transition-colors border shadow-sm bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200"
                                                        title="Replace PDF (Update TTD Luar)"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCloseDoc(doc.id)}
                                                        className="p-2 rounded-lg transition-colors border shadow-sm bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                                        title="Close Doc"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="p-2 rounded-lg transition-colors border shadow-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        title="Delete Doc"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col bg-white/95 dark:bg-slate-800/95 p-6 border-2 border-primary/20 shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Buat Dokumen Baru</h2>
                        <form onSubmit={handleCreate} className="flex flex-col gap-4 overflow-y-auto">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Nama Docs</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="glass-input w-full" placeholder="Cth: Dokumen Kontrak" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Kategori</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input w-full">
                                    <option value="RF">RF</option>
                                    <option value="PR">PR</option>
                                    <option value="IM">IM</option>
                                    <option value="LPJ">LPJ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Upload PDF</label>
                                <input required type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="glass-input w-full py-2" />
                            </div>
                            
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">Pilih Orang Yang Terlibat (Tag)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700">
                                    {employees.filter(e => e.status === 'Aktif').map(emp => (
                                        <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-primary focus:ring-primary h-4 w-4"
                                                checked={selectedUsers.includes(emp.id)}
                                                onChange={() => toggleUserSelection(emp.id)}
                                            />
                                            <span className="text-slate-700 dark:text-slate-300">{emp.nama_lengkap} <span className="text-slate-400 text-xs">({emp.role})</span></span>
                                        </label>
                                    ))}
                                    {employees.filter(e => e.status === 'Aktif').length === 0 && <span className="text-sm text-slate-500">Tidak ada karyawan aktif.</span>}
                                </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium">Batal</button>
                                <button type="submit" disabled={saving} className="glass-button px-6 flex justify-center items-center min-w-[120px]">
                                    {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Buat Dokumen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PDF Viewer & Editor Modal */}
            {selectedDocForPdf && (
                <PdfViewerModal 
                    doc={selectedDocForPdf} 
                    employees={employees}
                    onClose={() => {
                        setSelectedDocForPdf(null);
                        loadData(); // Refresh if updated
                    }} 
                />
            )}

            {/* Hidden File Input for Replacing PDF */}
            <input 
                type="file" 
                accept="application/pdf"
                ref={replaceFileInputRef}
                style={{ display: 'none' }}
                onChange={handleReplaceFileChange}
            />
        </div>
    );
}
