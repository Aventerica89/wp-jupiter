"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface UpdateItem {
  siteId: number;
  siteName: string;
  type: "plugin" | "theme";
  slug: string;
  name: string;
}

interface UpdateResult {
  siteId: number;
  type: "plugin" | "theme";
  slug: string;
  status: "success" | "failed";
  message?: string;
  newVersion?: string;
}

interface BulkUpdateDialogProps {
  updates: UpdateItem[];
  onClose: () => void;
  onComplete: () => void;
}

type Stage = "confirm" | "updating" | "complete";

export function BulkUpdateDialog({
  updates,
  onClose,
  onComplete,
}: BulkUpdateDialogProps) {
  const [stage, setStage] = useState<Stage>("confirm");
  const [results, setResults] = useState<UpdateResult[]>([]);
  const [progress, setProgress] = useState(0);

  const executeUpdates = async () => {
    setStage("updating");
    setProgress(0);

    try {
      const response = await fetch("/api/updates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: updates.map((u) => ({
            siteId: u.siteId,
            type: u.type,
            slug: u.slug,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Bulk update request failed");
      }

      const data = await response.json();
      setResults(data.results);
      setProgress(100);
      setStage("complete");
    } catch (error) {
      setResults(
        updates.map((u) => ({
          siteId: u.siteId,
          type: u.type,
          slug: u.slug,
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        }))
      );
      setStage("complete");
    }
  };

  // Simulated progress for better UX
  useEffect(() => {
    if (stage === "updating" && progress < 90) {
      const timer = setTimeout(() => {
        setProgress((p) => Math.min(p + Math.random() * 10, 90));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stage, progress]);

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {stage === "confirm" && (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Confirm Bulk Update
              </>
            )}
            {stage === "updating" && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating...
              </>
            )}
            {stage === "complete" && (
              <>
                {failedCount === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                Update Complete
              </>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {stage === "confirm" && (
            <>
              <p className="text-slate-600">
                You are about to update{" "}
                <span className="font-semibold">{updates.length}</span> items
                across{" "}
                <span className="font-semibold">
                  {new Set(updates.map((u) => u.siteId)).size}
                </span>{" "}
                sites.
              </p>

              <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {updates.map((update, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        {update.name}{" "}
                        <span className="text-slate-500">
                          ({update.siteName})
                        </span>
                      </span>
                      <Badge
                        variant={
                          update.type === "plugin" ? "default" : "secondary"
                        }
                      >
                        {update.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={executeUpdates}>
                  Update {updates.length} Items
                </Button>
              </div>
            </>
          )}

          {stage === "updating" && (
            <>
              <Progress value={progress} />
              <p className="text-center text-sm text-slate-600">
                Updating {updates.length} items... Please wait.
              </p>
            </>
          )}

          {stage === "complete" && (
            <>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {successCount}
                  </div>
                  <div className="text-sm text-slate-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {failedCount}
                  </div>
                  <div className="text-sm text-slate-500">Failed</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {results.map((result, idx) => {
                    const update = updates.find(
                      (u) =>
                        u.siteId === result.siteId &&
                        u.type === result.type &&
                        u.slug === result.slug
                    );
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {result.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{update?.name || result.slug}</span>
                        </div>
                        {result.status === "failed" && result.message && (
                          <span className="text-xs text-red-500 max-w-[200px] truncate">
                            {result.message}
                          </span>
                        )}
                        {result.status === "success" && result.newVersion && (
                          <Badge variant="success">v{result.newVersion}</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
