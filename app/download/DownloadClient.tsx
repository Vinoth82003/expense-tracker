"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Laptop,
  Loader2,
  CheckCircle,
} from "lucide-react";

const DOWNLOAD_URL =
  "https://github.com/Vinoth82003/expense-tracker/releases/download/v1.0.0/SpendWise.Setup.1.0.0.exe";

export default function DownloadClient() {
  const [os, setOs] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState("");

  useEffect(() => {
    const platform =
      navigator.userAgent.toLowerCase();

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
      setDownloaded(false);
      setProgress(0);
      setDownloadSpeed("");

      const startTime = Date.now();

      const response = await fetch(DOWNLOAD_URL);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      if (!response.body) {
        throw new Error("Response body missing");
      }

      const contentLength = Number(
        response.headers.get("content-length") || 0
      );

      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value.buffer.slice(0));
          receivedLength += value.length;

          if (contentLength > 0) {
            const percent = Math.round(
              (receivedLength / contentLength) * 100
            );
            setProgress(percent);
          }

          const elapsed =
            (Date.now() - startTime) / 1000;

          if (elapsed > 0) {
            const speed =
              receivedLength / 1024 / 1024 / elapsed;

            setDownloadSpeed(
              `${speed.toFixed(2)} MB/s`
            );
          }
        }
      }

      const blob = new Blob(chunks, {
        type: "application/octet-stream",
      });

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "SpendWise Setup 1.0.0.exe";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);

      setProgress(100);
      setDownloaded(true);
    } catch (error) {
      console.error(error);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const renderButton = () => {
    if (isWindows) {
      return (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-4 font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {downloading ? (
            <>
              <Loader2 className="animate-spin" />
              Downloading...
            </>
          ) : downloaded ? (
            <>
              <CheckCircle />
              Download Complete
            </>
          ) : (
            <>
              <Download />
              Download for Windows
            </>
          )}
        </button>
      );
    }

    if (isMac) {
      return (
        <button
          disabled
          className="w-full rounded-xl bg-white/10 py-4 text-white/50"
        >
          macOS Version Coming Soon
        </button>
      );
    }

    if (isLinux) {
      return (
        <button
          disabled
          className="w-full rounded-xl bg-white/10 py-4 text-white/50"
        >
          Linux Version Coming Soon
        </button>
      );
    }

    return (
      <button
        disabled
        className="w-full rounded-xl bg-white/10 py-4 text-white/50"
      >
        Unsupported Platform
      </button>
    );
  };

  const isWindows = os === "windows";
  const isMac = os === "mac";
  const isLinux = os === "linux";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
        <h1 className="text-3xl font-bold mb-3">
          Download SpendWise Desktop
        </h1>

        <p className="text-white/70 mb-8">
          Smart expense tracking for your desktop.
        </p>

        {renderButton()}

        {downloading && (
          <div className="mt-6 space-y-3">
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm text-white/70">
              <span>
                {progress > 0
                  ? `${progress}% downloaded`
                  : "Preparing download..."}
              </span>

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