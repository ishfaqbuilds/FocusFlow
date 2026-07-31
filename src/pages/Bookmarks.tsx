import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getLocalDateStr } from "@/hooks/useSessions";
import {
  Plus,
  Trash2,
  ExternalLink,
  Edit,
  Globe,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Bookmark {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export default function Bookmarks() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem("focusflow_bookmarks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  // Save bookmarks to localStorage
  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem("focusflow_bookmarks", JSON.stringify(newBookmarks));
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const addBookmark = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter a bookmark name", variant: "destructive" });
      return;
    }

    if (!url.trim()) {
      toast({ title: "URL required", description: "Please enter a URL", variant: "destructive" });
      return;
    }

    // Auto-add https:// if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    if (!validateUrl(finalUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL", variant: "destructive" });
      return;
    }

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: finalUrl,
      createdAt: getLocalDateStr(),
    };

    saveBookmarks([...bookmarks, newBookmark]);
    resetForm();
    setIsAddDialogOpen(false);
    toast({ title: "Bookmark added", description: "Your bookmark has been created" });
  };

  const updateBookmark = () => {
    if (!editingBookmark || !name.trim()) {
      toast({ title: "Name required", description: "Please enter a bookmark name", variant: "destructive" });
      return;
    }

    if (!url.trim()) {
      toast({ title: "URL required", description: "Please enter a URL", variant: "destructive" });
      return;
    }

    // Auto-add https:// if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    if (!validateUrl(finalUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL", variant: "destructive" });
      return;
    }

    const updatedBookmarks = bookmarks.map((bookmark) =>
      bookmark.id === editingBookmark.id
        ? { ...bookmark, name: name.trim(), url: finalUrl }
        : bookmark
    );

    saveBookmarks(updatedBookmarks);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingBookmark(null);
    toast({ title: "Bookmark updated", description: "Your bookmark has been updated" });
  };

  const deleteBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    saveBookmarks(newBookmarks);
    setDeleteConfirmId(null);
    toast({ title: "Bookmark deleted", description: "The bookmark has been removed" });
  };

  const openBookmark = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openEditDialog = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setName(bookmark.name);
    setUrl(bookmark.url);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setName("");
    setUrl("");
  };

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  const filteredBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bookmarks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">Save and access your favorite study resources</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bookmark
        </Button>
      </div>

      {/* Bookmark Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{bookmarks.length}</p>
              <p className="text-xs text-muted-foreground">Total Bookmarks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {bookmarks.filter(b => b.createdAt === getLocalDateStr()).length}
              </p>
              <p className="text-xs text-muted-foreground">Added Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmark List */}
      {filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No bookmarks yet. Add your first bookmark to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredBookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {getFaviconUrl(bookmark.url) ? (
                          <img
                            src={getFaviconUrl(bookmark.url)!}
                            alt=""
                            className="w-6 h-6"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement!.innerHTML = `<Globe className="h-5 w-5 text-muted-foreground" />`;
                            }}
                          />
                        ) : (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{bookmark.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {bookmark.createdAt}
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openBookmark(bookmark.url)}
                          className="text-muted-foreground hover:text-primary p-1"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(bookmark)}
                          className="text-muted-foreground hover:text-primary p-1"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(bookmark.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Bookmark Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Bookmark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bookmark name (e.g., GitHub, Khan Academy)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                URL will automatically use https:// if not specified
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={addBookmark}>Add Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bookmark Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bookmark name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL *</Label>
              <Input
                id="edit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingBookmark(null); }}>
              Cancel
            </Button>
            <Button onClick={updateBookmark}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This bookmark will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirmId) deleteBookmark(deleteConfirmId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}