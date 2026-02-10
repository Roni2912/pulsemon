"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DeleteStatusPageButtonProps {
  statusPageId: string;
}

export function DeleteStatusPageButton({ statusPageId }: DeleteStatusPageButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this status page? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/status-pages/${statusPageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        toast({
          variant: "destructive",
          title: "Failed to delete status page",
          description: result.error || "An unexpected error occurred.",
        });
        return;
      }

      toast({
        title: "Status page deleted",
        description: "The status page has been permanently deleted.",
      });

      router.push("/dashboard/status-pages");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </>
      )}
    </Button>
  );
}
