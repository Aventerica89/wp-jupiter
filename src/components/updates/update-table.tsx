"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Palette } from "lucide-react";

interface PendingUpdate {
  id: string;
  siteId: number;
  siteName: string;
  siteUrl: string;
  type: "plugin" | "theme";
  name: string;
  slug: string;
  currentVersion: string;
  newVersion: string;
  isActive: boolean;
}

interface UpdateTableProps {
  updates: PendingUpdate[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

type GroupBy = "none" | "site" | "name";
type FilterType = "all" | "plugin" | "theme";

export function UpdateTable({
  updates,
  selectedIds,
  onSelectionChange,
}: UpdateTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("site");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const filteredUpdates = useMemo(() => {
    if (filterType === "all") return updates;
    return updates.filter((u) => u.type === filterType);
  }, [updates, filterType]);

  const groupedUpdates = useMemo(() => {
    if (groupBy === "none") {
      return { ungrouped: filteredUpdates };
    }

    return filteredUpdates.reduce(
      (groups, update) => {
        const key = groupBy === "site" ? update.siteName : update.name;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(update);
        return groups;
      },
      {} as Record<string, PendingUpdate[]>
    );
  }, [filteredUpdates, groupBy]);

  const allSelected =
    filteredUpdates.length > 0 &&
    filteredUpdates.every((u) => selectedIds.has(u.id));

  const someSelected =
    !allSelected && filteredUpdates.some((u) => selectedIds.has(u.id));

  const toggleAll = () => {
    if (allSelected) {
      const newSelection = new Set(selectedIds);
      filteredUpdates.forEach((u) => newSelection.delete(u.id));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedIds);
      filteredUpdates.forEach((u) => newSelection.add(u.id));
      onSelectionChange(newSelection);
    }
  };

  const toggleOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const toggleGroup = (groupUpdates: PendingUpdate[]) => {
    const groupIds = groupUpdates.map((u) => u.id);
    const allGroupSelected = groupIds.every((id) => selectedIds.has(id));

    const newSelection = new Set(selectedIds);
    if (allGroupSelected) {
      groupIds.forEach((id) => newSelection.delete(id));
    } else {
      groupIds.forEach((id) => newSelection.add(id));
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
          <span className="text-sm text-slate-600">
            {selectedIds.size} of {filteredUpdates.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            <option value="all">All Types</option>
            <option value="plugin">Plugins Only</option>
            <option value="theme">Themes Only</option>
          </select>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            <option value="site">Group by Site</option>
            <option value="name">Group by Name</option>
            <option value="none">No Grouping</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Object.entries(groupedUpdates).map(([groupName, groupUpdates]) => {
          const groupSelected = groupUpdates.every((u) =>
            selectedIds.has(u.id)
          );
          const groupPartial =
            !groupSelected && groupUpdates.some((u) => selectedIds.has(u.id));

          return (
            <div
              key={groupName}
              className="border-b border-slate-200 last:border-b-0"
            >
              {groupBy !== "none" && (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2">
                  <Checkbox
                    checked={groupPartial ? "indeterminate" : groupSelected}
                    onCheckedChange={() => toggleGroup(groupUpdates)}
                    aria-label={`Select all in ${groupName}`}
                  />
                  <span className="font-medium text-slate-700">{groupName}</span>
                  <Badge variant="secondary">{groupUpdates.length}</Badge>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {groupUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(update.id)}
                        onCheckedChange={() => toggleOne(update.id)}
                        aria-label={`Select ${update.name}`}
                      />
                      <div className="flex items-center gap-2">
                        {update.type === "plugin" ? (
                          <Package className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Palette className="h-4 w-4 text-slate-400" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {update.name}
                          </p>
                          {groupBy !== "site" && (
                            <p className="text-xs text-slate-500">
                              {update.siteName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <span className="text-slate-500">
                          {update.currentVersion}
                        </span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="font-medium text-green-600">
                          {update.newVersion}
                        </span>
                      </div>
                      <Badge
                        variant={
                          update.type === "plugin" ? "default" : "secondary"
                        }
                      >
                        {update.type}
                      </Badge>
                      {update.isActive && (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredUpdates.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            No updates available
          </div>
        )}
      </div>
    </div>
  );
}
