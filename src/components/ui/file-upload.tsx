"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image as ImageIcon, X, Check } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  accept: string;
  maxSize: number; // in bytes
  type: "image" | "document";
  disabled?: boolean;
  currentFile?: {
    name: string;
    size: string;
    url?: string;
  } | null;
  onRemove?: () => void;
  className?: string;
}

export function FileUpload({
  onFileUpload,
  accept,
  maxSize,
  type,
  disabled = false,
  currentFile,
  onRemove,
  className = ""
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}`;
    }

    const allowedTypes = accept.split(',').map(t => t.trim());
    if (!allowedTypes.some(allowedType => 
      file.type.match(allowedType.replace('*', '.*')) ||
      file.name.toLowerCase().endsWith(allowedType.replace('*', ''))
    )) {
      return `Tipo de arquivo não permitido. Formatos aceitos: ${accept}`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const Icon = type === "image" ? ImageIcon : FileText;

  // Se já tem arquivo carregado, mostrar preview
  if (currentFile) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">{currentFile.name}</p>
              <p className="text-sm text-green-600">{currentFile.size}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {currentFile.url && type === "image" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentFile.url, '_blank')}
                className="text-green-600 hover:text-green-700"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-[#98ab44] bg-[#98ab44]/5' 
            : 'border-gray-300 hover:border-[#98ab44]/50'
          }
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
          }
        `}
      >
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
            isDragging ? 'bg-[#98ab44]/10' : 'bg-gray-100'
          }`}>
            <Icon className={`w-6 h-6 ${isDragging ? 'text-[#98ab44]' : 'text-gray-400'}`} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {isDragging ? 'Solte o arquivo aqui' : 'Upload de Arquivo'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            Arraste e solte ou clique para selecionar
          </p>
          
          <div className="text-sm text-gray-400 mb-4">
            <p>Formatos aceitos: {accept}</p>
            <p>Tamanho máximo: {formatFileSize(maxSize)}</p>
          </div>
          
          <Button 
            disabled={disabled || isUploading}
            className="bg-[#98ab44] hover:bg-[#98ab44]/90"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Enviando..." : "Selecionar Arquivo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

