import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UploadStatus = "pending" | "uploading" | "success" | "error"

export interface UploadFile {
  id: string
  name: string
  status: UploadStatus
  progress: number
  error?: string
  size: number
  uploadedAt?: Date
  platform?: "n8n" | "make"
}

interface UploadStore {
  files: UploadFile[]
  addFile: (file: UploadFile) => void
  updateFile: (id: string, updates: Partial<UploadFile>) => void
  removeFile: (id: string) => void
  dismissFile: (id: string) => void
  clearFiles: () => void
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set) => ({
      files: [],
      addFile: (file) =>
        set((state) => ({
          files: [file, ...state.files].slice(0, 10), // Keep only the 10 most recent uploads
        })),
      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((file) => (file.id === id ? { ...file, ...updates } : file)),
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
        })),
      dismissFile: (id) =>
        set((state) => ({
          files: state.files.map((file) => (file.id === id ? { ...file, dismissed: true } : file)),
        })),
      clearFiles: () => set({ files: [] }),
    }),
    {
      name: "upload-store",
      getStorage: () => localStorage,
    },
  ),
)

