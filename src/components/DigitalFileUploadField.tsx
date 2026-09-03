import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  UploadCloud,
  Link2,
  FileVideo,
  FileText,
  Box,
  FileArchive,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

type FileType = "mp4" | "pdf" | "stl" | "zip";

type DigitalFileUploadFieldProps = {
  fileType: FileType;
  value: string;
  onChange: (url: string) => void;
};

const FILE_CONFIG: Record<FileType, {
  accept: string;
  extensions: string;
  maxSize: number;
  label: string;
  icon: typeof FileVideo;
  bucketPath: string;
  mimeCheck: (mime: string, name: string) => boolean;
}> = {
  mp4: {
    accept: "video/mp4,video/webm",
    extensions: ".mp4, .webm",
    maxSize: 500 * 1024 * 1024,
    label: "Vidéo Tutoriel",
    icon: FileVideo,
    bucketPath: "videos",
    mimeCheck: (mime, name) => mime.startsWith("video/") || /\.(mp4|webm)$/i.test(name),
  },
  pdf: {
    accept: "application/pdf",
    extensions: ".pdf",
    maxSize: 100 * 1024 * 1024,
    label: "Patron Cosplay (PDF)",
    icon: FileText,
    bucketPath: "documents",
    mimeCheck: (mime, name) => mime === "application/pdf" || /\.pdf$/i.test(name),
  },
  stl: {
    accept: ".stl,.obj,model/stl,application/sla",
    extensions: ".stl, .obj",
    maxSize: 200 * 1024 * 1024,
    label: "Modèle 3D Cosplay",
    icon: Box,
    bucketPath: "models",
    mimeCheck: (_mime, name) => /\.(stl|obj)$/i.test(name),
  },
  zip: {
    accept: ".zip,.rar,.7z,application/zip,application/x-rar-compressed,application/x-7z-compressed",
    extensions: ".zip, .rar, .7z",
    maxSize: 500 * 1024 * 1024,
    label: "Pack Cosplay Complet",
    icon: FileArchive,
    bucketPath: "packs",
    mimeCheck: (_mime, name) => /\.(zip|rar|7z)$/i.test(name),
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function DigitalFileUploadField({ fileType, value, onChange }: DigitalFileUploadFieldProps) {
  const config = FILE_CONFIG[fileType];
  const Icon = config.icon;
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value && value !== "#" ? value : "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function validateFile(file: File): string | null {
    if (!config.mimeCheck(file.type, file.name)) {
      return `Format non supporté. Accepté : ${config.extensions}`;
    }
    if (file.size > config.maxSize) {
      return `Fichier trop volumineux (${formatBytes(file.size)}). Maximum : ${formatBytes(config.maxSize)}`;
    }
    return null;
  }

  async function uploadFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${config.bucketPath}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from("admin-files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (uploadError) {
      setError(`Erreur lors du téléversement : ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("admin-files")
      .getPublicUrl(data.path);

    onChange(urlData.publicUrl);
    setUrlInput(urlData.publicUrl);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function clearFile() {
    onChange("");
    setUrlInput("");
    setError(null);
  }

  const hasFile = Boolean(value && value !== "#");
  const isVideo = fileType === "mp4" && hasFile;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-ink-900">
          Fichier numérique — {config.label}
        </label>
        <div className="dfu-mode-toggle">
          <button
            type="button"
            className={`dfu-mode-btn ${mode === "upload" ? "dfu-mode-btn-active" : ""}`}
            onClick={() => setMode("upload")}
          >
            <UploadCloud className="w-3.5 h-3.5 inline mr-1" /> Téléverser
          </button>
          <button
            type="button"
            className={`dfu-mode-btn ${mode === "url" ? "dfu-mode-btn-active" : ""}`}
            onClick={() => setMode("url")}
          >
            <Link2 className="w-3.5 h-3.5 inline mr-1" /> Coller un lien
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          className={`dfu-zone ${dragOver ? "dfu-zone-drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={config.accept}
            className="hidden"
            onChange={handleFileSelect}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-sakura-500 animate-spin" />
              <p className="text-sm font-medium text-ink-700">Téléversement en cours...</p>
              {progress > 0 && (
                <div className="w-48 h-1.5 bg-ink-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sakura-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          ) : hasFile ? (
            <div className="flex flex-col items-center gap-3">
              <div className="dfu-icon bg-matcha-50 text-matcha-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Fichier lié</p>
                <p className="text-xs text-ink-400 mt-0.5 max-w-xs truncate">{value}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-error-600 hover:text-error-700"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
              >
                <X className="w-3.5 h-3.5" /> Retirer le fichier
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="dfu-icon bg-sakura-50 text-sakura-500">
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink-700">
                Cliquez ou glissez votre fichier ici
              </p>
              <p className="text-xs text-ink-400">
                {config.extensions} — jusqu'à {formatBytes(config.maxSize)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value);
                setError(null);
              }}
              placeholder="https://cdn.exemple.com/ma-video.mp4"
              className="input-field flex-1"
            />
            {urlInput && (
              <button
                type="button"
                className="btn-outline px-3"
                onClick={clearFile}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-ink-400">
            Collez le lien direct vers le fichier hébergé (CDN, Cloudinary, AWS S3, Google Drive, etc.)
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-error-50 text-error-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isVideo && mode === "upload" && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-ink-500 mb-2">Aperçu vidéo</p>
          <video
            src={value}
            controls
            className="w-full aspect-video rounded-xl bg-ink-950 object-contain"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
