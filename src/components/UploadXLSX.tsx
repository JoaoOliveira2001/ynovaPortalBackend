import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

interface SelectedFile {
  name: string;
  file: File;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export default function UploadXLSX() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile({
      name: file.name,
      file,
    });
    setStatus('idle');
    setMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      openFilePicker();
      return;
    }

    try {
      setStatus('loading');
      setMessage('Enviando fatura...');

      const formData = new FormData();
      formData.append('file', selectedFile.file, selectedFile.name);

      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao enviar');
      }

      setStatus('success');
      setMessage('✅ Fatura enviada com sucesso');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Erro ao enviar fatura';
      setMessage(`❌ ${message}`);
    }
  };

  const isLoading = status === 'loading';

  const statusClassName =
    status === 'success'
      ? 'text-green-600 dark:text-green-400'
      : status === 'error'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-700 dark:text-gray-300';

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUpload}
          disabled={isLoading}
          className="hidden sm:inline-flex items-center gap-2 bg-white text-yn-orange font-medium px-3 py-2 rounded-md shadow-sm hover:bg-white/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Enviar Fatura
        </button>

        <button
          type="button"
          onClick={handleUpload}
          disabled={isLoading}
          aria-label="Enviar Fatura"
          className="sm:hidden inline-flex items-center justify-center bg-white text-yn-orange w-9 h-9 rounded-md shadow-sm hover:bg-white/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={18} />}
        </button>
      </div>

      {(selectedFile || status !== 'idle') && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-[#2b3238] dark:bg-[#1a1f24]">
          {selectedFile ? (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Arquivo selecionado
                </p>
                <p className="mt-1 break-words text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
              </div>
              <button
                type="button"
                onClick={openFilePicker}
                className="text-xs font-medium text-yn-orange hover:text-yn-orange/80"
              >
                Trocar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              className="text-xs font-medium text-yn-orange hover:text-yn-orange/80"
            >
              Selecionar novo arquivo
            </button>
          )}

          {message && (
            <p className={`mt-2 ${statusClassName}`} role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

