"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Laptop,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function DownloadClient() {
  const [os, setOs] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState("");

  useEffect(() => {
    const platform = navigator.platform.toLowerCase();

    if (platform.includes("win")) {
      setOs("windows");
    } else if (platform.includes("mac")) {
      setOs("mac");
    } else if (platform.includes("linux")) {
      setOs("linux");
    } else {
      setOs("unknown");
    }
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setProgress(0);
      setDownloaded(false);

      const startTime = Date.now();

      const response = await fetch(
        "/download/SpendWise Setup 1.0.0.exe"
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      if (!response.body) {
        throw new Error("No response body found");
      }

      const contentLength = Number(
        response.headers.get("content-length")
      );

      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks: BlobPart[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value.buffer.slice(0));
          receivedLength += value.length;

          const percent = Math.round(
            (receivedLength / contentLength) * 100
          );

          setProgress(percent);

          const elapsedSeconds =
            (Date.now() - startTime) / 1000;

          const speedMB =
            receivedLength / 1024 / 1024 / elapsedSeconds;

          setDownloadSpeed(`${speedMB.toFixed(2)} MB/s`);
        }
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "SpendWise Setup 1.0.0.exe";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch (error) {
      console.error(error);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const isWindows = os === "windows";
  const isMac = os === "mac";
  const isLinux = os === "linux";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-bold mb-3">
          Download SpendWise Desktop
        </h1>

        <p className="text-white/70 mb-8">
          Smart expense tracking for your desktop.
        </p>

        {isWindows && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-4 font-semibold hover:opacity-90 transition"
          >
            {downloading ? (
              <>
                <Loader2 className="animate-spin" />
                Downloading...
              </>
            ) : downloaded ? (
              <>
                <CheckCircle />
                Downloaded
              </>
            ) : (
              <>
                <Download />
                Download for Windows
              </>
            )}
          </button>
        )}

        {isMac && (
          <button
            disabled
            className="w-full rounded-xl bg-white/10 py-4 text-white/50"
          >
            macOS Version Coming Soon
          </button>
        )}

        {isLinux && (
          <button
            disabled
            className="w-full rounded-xl bg-white/10 py-4 text-white/50"
          >
            Linux Version Coming Soon
          </button>
        )}

        {os === "unknown" && (
          <button
            disabled
            className="w-full rounded-xl bg-white/10 py-4 text-white/50"
          >
            Unsupported Platform
          </button>
        )}

        {downloading && (
          <div className="mt-6 space-y-2">
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm text-white/70">
              <span>{progress}% downloaded</span>
              <span>{downloadSpeed}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-sm text-white/50">
          <Laptop size={16} />
          Current OS: {os || "Detecting..."}
        </div>
      </div>
    </div>
  );
}