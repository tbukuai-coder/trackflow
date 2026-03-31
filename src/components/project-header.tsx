"use client";

import { useState } from "react";
import { updateProject } from "@/lib/actions/projects";
import { canEditProject } from "@/lib/permissions";
import type { Role } from "@/db/schema";

interface ProjectHeaderProps {
  workspaceSlug: string;
  projectId: string;
  name: string;
  description: string | null;
  role: Role;
}

export function ProjectHeader({
  workspaceSlug,
  projectId,
  name,
  description,
  role,
}: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = canEditProject(role);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.set("name", editName.trim());
    
    await updateProject(workspaceSlug, projectId, formData);
    setIsEditing(false);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setEditName(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mb-8">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="text-3xl font-bold border-b-2 border-primary bg-transparent focus:outline-none w-full"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting || !editName.trim()}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 border rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 group">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">{name}</h1>
        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-sm"
          >
            ✏️ Edit
          </button>
        )}
      </div>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
