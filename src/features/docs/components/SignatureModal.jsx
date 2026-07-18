import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignatureModal({ onClose, onSave }) {
    const sigPad = useRef({});
    const [saving, setSaving] = useState(false);

    const clear = () => {
        sigPad.current.clear();
    };

    const save = async () => {
        if (sigPad.current.isEmpty()) {
            alert('Tanda tangan kosong!');
            return;
        }
        setSaving(true);
        // Get canvas data URL (png). Using getCanvas() instead of getTrimmedCanvas() to avoid Vite bug.
        const dataURL = sigPad.current.getCanvas().toDataURL('image/png');
        await onSave(dataURL);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-lg w-full flex flex-col items-center">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Beri Tanda Tangan</h3>
                
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg w-full bg-slate-50 dark:bg-slate-900 mb-4">
                    <SignatureCanvas 
                        penColor="black"
                        canvasProps={{ className: 'w-full h-48 rounded-lg' }} 
                        ref={sigPad} 
                    />
                </div>

                <div className="flex gap-3 w-full justify-end">
                    <button 
                        onClick={clear}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                    >
                        Ulangi
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={save}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-semibold flex items-center justify-center min-w-[120px]"
                    >
                        {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Selesai / Solve'}
                    </button>
                </div>
            </div>
        </div>
    );
}
