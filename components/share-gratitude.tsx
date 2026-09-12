"use client";
import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { makeShareCard } from "@/lib/share-card";

export function ShareGratitude({
  body,
  attribution,
  isPrivate,
  personal = false,
  background,
  photo,
  generated,
}: {
  body: string;
  attribution?: string;
  background?: string;
  photo?: string | null;
  generated?: boolean;
  isPrivate: boolean;
  personal?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [image, setImage] = useState<{ url: string; file: File } | null>(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [canShare, setCanShare] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    setImage(null);
    setError("");
    setStatus("");
    const timer = setTimeout(() => {
      if (!body.trim()) return;
      makeShareCard(
        attribution ? `${body}\n— ${attribution}` : body,
        background,
        photo,
        generated,
      )
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          const file = new File([blob], "my-gratitude.png", {
            type: "image/png",
          });
          setImage({ url: objectUrl, file });
          setCanShare(!!navigator.canShare?.({ files: [file] }));
        })
        .catch((error) => {
          if (!cancelled)
            setError(
              error instanceof Error
                ? error.message
                : "Could not prepare the image. Please try again.",
            );
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, body, background, photo, generated, attribution]);
  async function share() {
    if (!image) return;
    setError("");
    try {
      await navigator.share({ files: [image.file] });
      setStatus("Your image was handed to the sharing menu.");
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          "Sharing was not available. Save the image, then attach it to a post, email or message.",
        );
    }
  }
  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
        }}
      >
        <Share2 />
        <span className="sr-only">Share image</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="serif text-3xl">
              Let a little good travel.
            </DialogTitle>
            <DialogDescription>
              Share your gratitude on Facebook, LinkedIn, WhatsApp, Instagram,
              by email or text message.
            </DialogDescription>
          </DialogHeader>
          <p className="field-help">
            {personal
              ? "This is a personal thank-you. Sharing exports it outside the private exchange."
              : isPrivate
                ? "This journal entry is private. Sharing this image takes these words outside your private journal."
                : "Sharing this image takes your words outside your circle."}{" "}
            {attribution &&
              `Shared from ${attribution}. Their name will appear on the image. `}
            The original words, background and author credit are preserved.
          </p>
          {image ? (
            <img
              src={image.url}
              alt="Preview of your gratitude sharing image"
              className="share-preview"
            />
          ) : (
            <p className="field-help" role="status">
              {body.trim()
                ? "Preparing your image…"
                : "This gratitude has no text to share."}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="field-help" role="status">
              {status}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button"
              disabled={!image}
              onClick={() => {
                if (!image) return;
                const a = document.createElement("a");
                a.href = image.url;
                a.download = image.file.name;
                a.click();
                setStatus(
                  "Image saved. Open Facebook, LinkedIn, WhatsApp, Instagram, your email or messages app, then attach it from your photos or downloads.",
                );
              }}
            >
              <Download />
              Save image
            </button>
            {canShare && (
              <button
                className="button primary"
                disabled={!image}
                onClick={share}
              >
                <Share2 />
                Choose where to share
              </button>
            )}
          </div>
          <p className="field-help">
            {canShare
              ? "Choose an available app from your device’s share menu. If your preferred app isn’t listed, save the image and attach it there."
              : "Save the image, then attach it to your post, email or text message. Direct sharing isn’t available in this browser."}{" "}
            Nothing is posted automatically.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
