import { Suspense } from "react";
import { WorkflowCanvas } from "@/components/WorkflowCanvas";
import { apps } from "@/lib/data";

export const metadata = {
  title: "Workflow — Build your AI stack",
  description: "Drag AI apps onto a canvas and see which ones pair well.",
};

export default function WorkflowPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Build your AI stack
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-strong">
          Drag apps onto the canvas. Compatible pairs auto-connect with glowing
          lines and traveling pulses. Pick a use case to start fast.
        </p>
      </header>
      <Suspense fallback={null}>
        <WorkflowCanvas apps={apps} />
      </Suspense>
    </div>
  );
}
