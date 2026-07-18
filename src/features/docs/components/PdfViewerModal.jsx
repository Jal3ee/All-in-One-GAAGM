import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ChevronLeft, ChevronRight, PenTool, Type, Highlighter, Save } from 'lucide-react';
import { Rnd } from 'react-rnd';
import SignatureModal from './SignatureModal';
import { useAuth } from '../../auth/contexts/AuthContext';
import { getDocTags, updateDocTag, replaceDocFile, downloadDocBase64, addDocTagsWithConfig } from '../services/apiDocs';
import { createSystemLog } from '../../admin/services/apiLogs';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerModal({ doc, employees, onClose }) {
    const { user } = useAuth();
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    
    const [tags, setTags] = useState([]);
    const [activeTool, setActiveTool] = useState(null); // 'sign', 'text', 'highlight'
    const [selectedEmployeeForTag, setSelectedEmployeeForTag] = useState('');
    
    const [isSignatureOpen, setIsSignatureOpen] = useState(false);
    const [activeTagForSign, setActiveTagForSign] = useState(null);
    
    const [saving, setSaving] = useState(false);
    const [pdfBase64, setPdfBase64] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        loadTags();
        loadPdf();
    }, []);

    const loadPdf = async () => {
        if (!doc.file_id) {
            alert('Gagal memuat PDF: Dokumen lama tidak memiliki file_id. Harap buat dokumen baru.');
            return;
        }
        const { data, error } = await downloadDocBase64(doc.file_id);
        if (data?.base64) {
            setPdfBase64(data.base64);
        } else {
            alert('Gagal memuat PDF: ' + (error || 'Unknown error'));
        }
    };

    const loadTags = async () => {
        const { data } = await getDocTags(doc.id);
        if (data) {
            // tags from DB
            const parsedTags = data.map(t => {
                let config = {};
                try { config = JSON.parse(t.config || '{}'); } catch(e) {}
                return { ...t, ...config };
            });
            setTags(parsedTags.filter(t => t.x !== undefined)); // only mapped tags
        }
    };

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    const handleCanvasClick = (e) => {
        if (!activeTool) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate coordinates relative to the page
        // Simplified scaling logic for demonstration
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (activeTool === 'sign') {
            if (!selectedEmployeeForTag) return alert('Pilih orang untuk tag Sign Here');
            
            const newTag = {
                id: 'temp-' + Date.now(), // Real DB id needed if new
                doc_id: doc.id,
                user_id: selectedEmployeeForTag,
                status: 'pending',
                type: 'sign',
                page: pageNumber,
                x, y,
                width: 100, height: 40
            };
            setTags([...tags, newTag]);
            setActiveTool(null);
        } else if (activeTool === 'text') {
             const newTag = {
                id: 'temp-' + Date.now(),
                doc_id: doc.id,
                type: 'text',
                page: pageNumber,
                text: 'New Text',
                x, y,
            };
            setTags([...tags, newTag]);
            setActiveTool(null);
        } else if (activeTool === 'highlight') {
            const newTag = {
                id: 'temp-' + Date.now(),
                doc_id: doc.id,
                type: 'highlight',
                page: pageNumber,
                x, y, width: 200, height: 20
            };
            setTags([...tags, newTag]);
            setActiveTool(null);
        }
    };

    const handleTagClick = (tag) => {
        if (tag.type === 'sign' && tag.user_id === user.profile.id && tag.status === 'pending') {
            setActiveTagForSign(tag);
            setIsSignatureOpen(true);
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const { data: dbTags } = await getDocTags(doc.id);
            
            for (const tag of tags) {
                if (tag.id.toString().startsWith('temp-')) {
                    const configData = JSON.stringify({
                        type: tag.type,
                        page: tag.page,
                        x: tag.x,
                        y: tag.y,
                        width: tag.width,
                        height: tag.height,
                        text: tag.text
                    });
                    
                    // Try to find an empty pending tag for this user to update
                    const emptyDbTag = (dbTags || []).find(dt => dt.user_id === tag.user_id && dt.status === 'pending' && (!dt.config || dt.config === '{}'));
                    
                    if (emptyDbTag) {
                        await updateDocTag(emptyDbTag.id, { config: configData });
                        emptyDbTag.config = configData; // mark as used
                    } else {
                        await addDocTagsWithConfig(doc.id, tag.user_id || '', configData);
                    }
                }
            }
            await createSystemLog('Edit Config Dokumen', `Menyimpan konfigurasi tag untuk dokumen: ${doc.title}`);
            alert('Konfigurasi posisi TTD & overlay berhasil disimpan ke server!');
            loadTags();
        } catch (e) {
            alert('Gagal menyimpan konfigurasi: ' + e.message);
        }
        setSaving(false);
    };

    const handleSignatureSave = async (dataUrl) => {
        setIsSignatureOpen(false);
        setSaving(true);
        
        try {
            // 1. Load existing PDF from fetched base64
            // pdfBase64 is data:application/pdf;base64,....
            const base64DataStr = pdfBase64.split(',')[1];
            const existingPdfBytes = Uint8Array.from(atob(base64DataStr), c => c.charCodeAt(0));
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            // 2. Embed signature image
            const pngImage = await pdfDoc.embedPng(dataUrl);
            
            // 3. Draw on the specific page
            const pages = pdfDoc.getPages();
            const targetPage = pages[activeTagForSign.page - 1];
            const { width, height } = targetPage.getSize();
            
            const pdfX = activeTagForSign.x;
            // pdf-lib's origin (0,0) is bottom-left. React DOM origin is top-left.
            // The box's DOM bottom-left Y coordinate is (activeTagForSign.y + activeTagForSign.height)
            // So in PDF coordinates, the Y is: height - (activeTagForSign.y + activeTagForSign.height)
            const pdfY = height - (activeTagForSign.y + activeTagForSign.height); 
            
            targetPage.drawImage(pngImage, {
                x: pdfX,
                y: pdfY,
                width: activeTagForSign.width,
                height: activeTagForSign.height,
            });
            
            // 4. Save and Upload new PDF
            const pdfBytes = await pdfDoc.save();
            const newBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            await replaceDocFile(doc.id, doc.file_id, newBlob);
            
            // 5. Update Tag status in DB
            if (!activeTagForSign.id.toString().startsWith('temp-')) {
                 await updateDocTag(activeTagForSign.id, { status: 'solved' });
            }
            
            // Update local state
            setTags(tags.map(t => t.id === activeTagForSign.id ? {...t, status: 'solved', signatureData: dataUrl} : t));
            await createSystemLog('Tanda Tangan', `Menandatangani dokumen: ${doc.title}`);
            alert('Tanda tangan berhasil disimpan!');
        } catch (error) {
            alert('Gagal memproses tanda tangan: ' + error.message);
        }
        setSaving(false);
    };

    const getEmployeeName = (id) => {
        return employees.find(e => e.id === id)?.nama_lengkap || 'Unknown';
    };

    // Render tags for current page
    const currentPageTags = tags.filter(t => t.page === pageNumber);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-white/95 dark:bg-slate-800/95 shadow-2xl animate-zoom-in relative">
            {/* Toolbar Sidebar */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Editor PDF</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Alat</p>
                        <button 
                            onClick={() => setActiveTool(activeTool === 'sign' ? null : 'sign')}
                            className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors ${activeTool === 'sign' ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <PenTool size={18} /> Tag Sign Here
                        </button>
                        {activeTool === 'sign' && (
                            <select 
                                value={selectedEmployeeForTag} 
                                onChange={e => setSelectedEmployeeForTag(e.target.value)}
                                className="w-full text-sm p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                            >
                                <option value="">Pilih Karyawan...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.nama_lengkap}</option>
                                ))}
                            </select>
                        )}

                        <button 
                            onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
                            className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors ${activeTool === 'text' ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Type size={18} /> Text Box
                        </button>
                        <button 
                            onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
                            className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors ${activeTool === 'highlight' ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Highlighter size={18} /> Highlight
                        </button>
                    </div>

                    <div className="mt-8">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Simpan Perubahan</p>
                        <button 
                            onClick={handleSaveConfig}
                            className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold"
                        >
                            <Save size={18} /> Save Config
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 flex flex-col items-center bg-slate-100 dark:bg-slate-800/50 overflow-hidden relative">
                {saving && (
                    <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">Menyimpan PDF...</span>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center gap-4 py-4 w-full justify-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
                    <button 
                        disabled={pageNumber <= 1} 
                        onClick={() => setPageNumber(p => p - 1)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <ChevronLeft />
                    </button>
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                        Halaman {pageNumber} dari {numPages || '--'}
                    </p>
                    <button 
                        disabled={pageNumber >= numPages} 
                        onClick={() => setPageNumber(p => p + 1)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <ChevronRight />
                    </button>
                </div>

                <div className="flex-1 w-full overflow-auto flex justify-center p-8 custom-scrollbar">
                    <div 
                        ref={containerRef}
                        className={`relative shadow-2xl bg-white ${activeTool ? 'cursor-crosshair' : ''}`}
                        onClick={handleCanvasClick}
                    >
                        {pdfBase64 ? (
                            <Document
                                file={pdfBase64}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="p-20 text-center">Memuat PDF...</div>}
                            >
                                <Page 
                                    pageNumber={pageNumber} 
                                    renderTextLayer={false} 
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        ) : (
                            <div className="p-20 text-center">Mengunduh PDF dari Server...</div>
                        )}

                        {/* Render Tags Overlay */}
                        {currentPageTags.map((tag, i) => {
                            if (tag.type === 'sign') {
                                const isMe = tag.user_id === user.profile.id;
                                const isPending = tag.status === 'pending';
                                
                                return (
                                    <Rnd
                                        key={tag.id || i}
                                        position={{ x: tag.x, y: tag.y }}
                                        size={{ width: tag.width, height: tag.height }}
                                        onDragStop={(e, d) => {
                                            const newTags = tags.map(t => t.id === tag.id ? { ...t, x: d.x, y: d.y } : t);
                                            setTags(newTags);
                                        }}
                                        onResizeStop={(e, direction, ref, delta, position) => {
                                            const newTags = tags.map(t => t.id === tag.id ? { 
                                                ...t, 
                                                width: parseFloat(ref.style.width), 
                                                height: parseFloat(ref.style.height),
                                                ...position
                                            } : t);
                                            setTags(newTags);
                                        }}
                                        bounds="parent"
                                    >
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTagClick(tag);
                                            }}
                                            className={`w-full h-full border-2 flex items-center justify-center p-2 rounded 
                                                ${isPending ? (isMe ? 'border-primary bg-primary/20 cursor-pointer animate-pulse' : 'border-orange-400 bg-orange-400/20') : 'border-green-500 bg-green-500/10'}
                                            `}
                                        >
                                            {tag.signatureData ? (
                                                <img src={tag.signatureData} alt="Signature" className="max-h-full max-w-full object-contain pointer-events-none" />
                                            ) : (
                                                <span className={`text-xs text-center leading-tight font-bold pointer-events-none ${isPending ? (isMe ? 'text-primary' : 'text-orange-600') : 'text-green-600'}`}>
                                                    Sign Here:<br/>{getEmployeeName(tag.user_id)}
                                                </span>
                                            )}
                                        </div>
                                    </Rnd>
                                );
                            } else if (tag.type === 'text') {
                                return (
                                    <Rnd
                                        key={tag.id || i}
                                        position={{ x: tag.x, y: tag.y }}
                                        onDragStop={(e, d) => {
                                            const newTags = tags.map(t => t.id === tag.id ? { ...t, x: d.x, y: d.y } : t);
                                            setTags(newTags);
                                        }}
                                        bounds="parent"
                                    >
                                        <div className="w-full h-full border border-blue-400 bg-blue-50/80 p-1 text-sm text-slate-800">
                                            {tag.text}
                                        </div>
                                    </Rnd>
                                );
                            } else if (tag.type === 'highlight') {
                                return (
                                    <Rnd
                                        key={tag.id || i}
                                        position={{ x: tag.x, y: tag.y }}
                                        size={{ width: tag.width, height: tag.height }}
                                        onDragStop={(e, d) => {
                                            const newTags = tags.map(t => t.id === tag.id ? { ...t, x: d.x, y: d.y } : t);
                                            setTags(newTags);
                                        }}
                                        onResizeStop={(e, direction, ref, delta, position) => {
                                            const newTags = tags.map(t => t.id === tag.id ? { 
                                                ...t, 
                                                width: parseFloat(ref.style.width), 
                                                height: parseFloat(ref.style.height),
                                                ...position
                                            } : t);
                                            setTags(newTags);
                                        }}
                                        bounds="parent"
                                    >
                                        <div className="w-full h-full bg-yellow-300/40 mix-blend-multiply pointer-events-none" />
                                    </Rnd>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
            
            {/* Signature Modal Overlay */}
            {isSignatureOpen && (
                <SignatureModal 
                    onClose={() => setIsSignatureOpen(false)}
                    onSave={handleSignatureSave}
                />
            )}
            </div>
        </div>
    );
}
