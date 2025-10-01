import React, { useMemo, useState } from 'react';
import { Lead } from '../types';

interface ModalUploadInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceRegistered: (lead: Omit<Lead, 'id'>) => void;
}

const SEGMENTS: Lead['segmento'][] = ['Industrial', 'Comercial', 'Serviços', 'Tecnologia'];

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cliente-energia';

const generateCnpjFromSeed = (seedSource: string) => {
  let seed = Array.from(seedSource).reduce((acc, char) => acc + char.charCodeAt(0), 0) + 137;
  const digits: number[] = [];

  for (let i = 0; i < 14; i += 1) {
    seed = (seed * 73 + 41) % 9973;
    const digit = (seed + i * 7) % 10;
    digits.push(digit === 0 && i === 0 ? 1 : digit);
  }

  return `${digits[0]}${digits[1]}.${digits[2]}${digits[3]}${digits[4]}.${digits[5]}${digits[6]}${digits[7]}/${digits[8]}${digits[9]}${digits[10]}${digits[11]}-${digits[12]}${digits[13]}`;
};

const createLeadFromInvoice = (file: File): Omit<Lead, 'id'> => {
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const normalizedName = toTitleCase(baseName.replace(/[_-]+/g, ' ').trim() || 'Cliente Energia');
  const seed = Array.from(file.name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const segment = SEGMENTS[seed % SEGMENTS.length];
  const domain = slugify(normalizedName);
  const contactFirstName = normalizedName.split(' ')[0] || 'Equipe';
  const phoneBase = (40000000 + (seed % 10000000)).toString().padStart(8, '0');
  const formattedPhone = `(11) ${phoneBase.slice(0, 4)}-${phoneBase.slice(4)}`;

  return {
    nome: normalizedName,
    cnpj: generateCnpjFromSeed(file.name),
    segmento: segment,
    statusFunil: 'amarelo',
    statusMigracao: 'em_analise',
    ultimaInteracao: new Date().toISOString().split('T')[0],
    contato: `${contactFirstName} - Equipe Financeira`,
    telefone: formattedPhone,
    email: `financeiro@${domain}.com.br`,
  };
};

export default function ModalUploadInvoice({ isOpen, onClose, onInvoiceRegistered }: ModalUploadInvoiceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const selectedFileName = useMemo(() => selectedFile?.name ?? '', [selectedFile]);

  const processFile = (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);

    const leadData = createLeadFromInvoice(file);

    setTimeout(() => {
      onInvoiceRegistered(leadData);
      setIsUploading(false);
      setSelectedFile(null);
      onClose();
    }, 800);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#3E3E3E] p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Enviar Fatura</h2>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging
              ? 'border-yn-orange bg-yn-orange/10 dark:bg-yn-orange/20'
              : 'border-gray-300 dark:border-[#1E1E1E]'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Arraste e solte o arquivo PDF/PNG/JPG aqui
          </p>
          <input
            id="invoice-upload"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={handleSelect}
          />
          <label
            htmlFor="invoice-upload"
            className={`inline-block px-4 py-2 rounded-lg cursor-pointer text-white ${
              isUploading
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-yn-orange hover:bg-yn-orange/90'
            }`}
            aria-disabled={isUploading}
          >
            {isUploading ? 'Processando...' : 'Selecionar arquivo'}
          </label>
          {selectedFileName && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-300" aria-live="polite">
              {isUploading ? `Processando ${selectedFileName}` : selectedFileName}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!isUploading) {
              setSelectedFile(null);
              onClose();
            }
          }}
          className="mt-4 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          disabled={isUploading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

