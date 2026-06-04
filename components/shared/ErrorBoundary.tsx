"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  error: any;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
        <p className="text-muted-foreground">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi admin.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={resetErrorBoundary} variant="default">
            Coba Lagi
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Kembali ke Home
          </Button>
        </div>
      </div>
    </div>
  );
}
