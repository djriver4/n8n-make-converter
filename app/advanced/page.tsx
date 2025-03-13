import { MappingManager } from "@/components/mapping-manager"
import { TestRunner } from "@/components/test-runner"
import { CoverageDisplay } from "@/components/coverage-display"

export default function AdvancedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Advanced Settings</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Configure custom mappings and run tests for the n8n ⟷ Make.com converter
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[600px]">
            <MappingManager />
          </div>
          <div className="h-[600px]">
            <TestRunner />
          </div>
        </div>

        <div className="mt-8">
          <CoverageDisplay />
        </div>
      </div>
    </main>
  )
}

