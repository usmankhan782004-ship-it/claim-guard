"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BillUploadProps {
    onUploadComplete?: (bill: {
        id: string;
        fileName: string;
        fileUrl: string;
    }) => void;
    onAnalyze?: (billId: string) => void;
}

export default function BillUpload({
    onUploadComplete,
    onAnalyze,
}: BillUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedBill, setUploadedBill] = useState<{
        id: string;
        fileName: string;
        fileUrl: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const processFile = useCallback(
        async (selectedFile: File) => {
            setFile(selectedFile);
            setError(null);
            setIsUploading(true);
            setUploadProgress(0);

            // Validate file
            const maxSize = 10 * 1024 * 1024;
            if (selectedFile.size > maxSize) {
                setError("File too large. Maximum 10MB allowed.");
                setIsUploading(false);
                return;
            }

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp",
            ];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError("Invalid file type. Please upload a PDF or image.");
                setIsUploading(false);
                return;
            }

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);

            try {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const res = await fetch("/api/upload-bill", {
                    method: "POST",
                    body: formData,
                });

                clearInterval(progressInterval);

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Upload failed");
                }

                const data = await res.json();
                setUploadProgress(100);
                setUploadedBill(data.bill);
                onUploadComplete?.(data.bill);
            } catch (err) {
                clearInterval(progressInterval);
                setError(
                    err instanceof Error ? err.message : "Upload failed. Please try again."
                );
                setUploadProgress(0);
            } finally {
                setIsUploading(false);
            }
        },
        [onUploadComplete]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                processFile(droppedFile);
            }
        },
        [processFile]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                processFile(selectedFile);
            }
        },
        [processFile]
    );

    const reset = () => {
        setFile(null);
        setUploadProgress(0);
        setUploadedBill(null);
        setError(null);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!uploadedBill ? (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Drop Zone */}
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer 
                transition-all duration-300 group
                ${isDragging
                                    ? "border-emerald-400 bg-emerald-500/5 scale-[1.02]"
                                    : "border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02]"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={handleFileInput}
                                className="hidden"
                            />

                            {/* Icon */}
                            <motion.div
                                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                                className="mb-4"
                            >
                                <svg
                                    className={`w-16 h-16 mx-auto ${isDragging ? "text-emerald-400" : "text-gray-600 group-hover:text-emerald-500/50"
                                        } transition-colors duration-300`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                    />
                                </svg>
                            </motion.div>

                            <p className="text-gray-300 font-medium mb-1">
                                {isDragging ? "Drop your bill here" : "Drag & drop your medical bill"}
                            </p>
                            <p className="text-gray-500 text-sm">
                                or <span className="text-emerald-400 underline">browse files</span>
                            </p>
                            <p className="text-gray-600 text-xs mt-3">
                                Supports PDF, JPEG, PNG, WebP • Max 10MB
                            </p>
                        </div>

                        {/* Upload Progress */}
                        {isUploading && file && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 glass-card p-4"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <svg
                                        className="w-5 h-5 text-emerald-400 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    <span className="text-sm text-gray-300 truncate">{file.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {Math.round(uploadProgress)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    /* ─── Upload Success ──────────────────────────── */
                    <motion.div
                        key="upload-success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
                        >
                            <svg
                                className="w-8 h-8 text-emerald-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </motion.div>

                        <h3 className="text-lg font-semibold text-white mb-1">
                            Bill Uploaded Successfully
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            {uploadedBill.fileName}
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => onAnalyze?.(uploadedBill.id)}
                                className="btn-primary text-sm"
                            >
                                🔍 Analyze Bill
                            </button>
                            <button onClick={reset} className="btn-secondary text-sm">
                                Upload Another
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
