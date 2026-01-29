"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag as TagIcon } from "lucide-react";

interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

const TAG_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: selectedColor,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create tag");
      }

      toast.success("Tag created");
      setNewTagName("");
      setSelectedColor(TAG_COLORS[0]);
      fetchTags();
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update tag");
      }

      toast.success("Tag updated");
      cancelEdit();
      fetchTags();
    } catch (error) {
      console.error("Failed to update tag:", error);
      toast.error("Failed to update tag");
    }
  };

  const deleteTag = async (id: number, name: string) => {
    if (!confirm(`Delete tag "${name}"? This will remove it from all sites.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete tag");
      }

      toast.success("Tag deleted");
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Organize your sites with custom tags
        </p>
      </div>

      {/* Create Tag */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Create New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
              className="max-w-xs"
            />
            <div className="flex gap-1">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-10 w-10 rounded-md border-2 transition-all ${
                    selectedColor === color
                      ? "border-slate-900 scale-110"
                      : "border-transparent hover:border-slate-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <Button onClick={createTag} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="py-8 text-center">
              <TagIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-muted-foreground">No tags created yet.</p>
              <p className="text-sm text-muted-foreground">
                Create your first tag to start organizing sites.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
                >
                  {editingId === tag.id ? (
                    <div className="flex flex-1 items-center gap-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                      />
                      <div className="flex gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`h-8 w-8 rounded border-2 ${
                              editColor === color
                                ? "border-slate-900 scale-110"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(tag.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Badge
                          style={{
                            backgroundColor: tag.color,
                            color: "#fff",
                          }}
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(tag)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteTag(tag.id, tag.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
