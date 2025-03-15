"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUploadStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useUploadStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    files: [],
    addFile: (file) => set((state) => ({
        files: [file, ...state.files].slice(0, 10), // Keep only the 10 most recent uploads
    })),
    updateFile: (id, updates) => set((state) => ({
        files: state.files.map((file) => (file.id === id ? Object.assign(Object.assign({}, file), updates) : file)),
    })),
    removeFile: (id) => set((state) => ({
        files: state.files.filter((file) => file.id !== id),
    })),
    dismissFile: (id) => set((state) => ({
        files: state.files.map((file) => (file.id === id ? Object.assign(Object.assign({}, file), { dismissed: true }) : file)),
    })),
    clearFiles: () => set({ files: [] }),
}), {
    name: "upload-store",
    getStorage: () => localStorage,
}));
