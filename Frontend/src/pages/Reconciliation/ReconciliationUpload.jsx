import React, { useRef, useState } from 'react';

const ReconciliationUpload = ({ onUpload, uploading }) => {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) {
            setFile(dropped);
        }
    };

    const handleUpload = () => {
        if (file) {
            onUpload(file);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Upload Timesheet</h3>
                    <p className="text-xs text-gray-400">Upload Excel file (.xls, .xlsx)</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-3 w-full sm:w-auto ${
                            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        onDragEnter={() => setDragActive(true)}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xls,.xlsx"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>{file ? file.name : 'Choose file or drag & drop'}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            !file || uploading
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            'Upload'
                        )}
                    </button>
                </div>
            </div>

            {file && (
                <div className="mt-2 text-xs text-green-600">
                    ✓ Ready to upload: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
            )}
        </div>
    );
};

export default ReconciliationUpload;