import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Pencil, Trash2, Images, Loader2, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  size: string;
  sort_order: number;
  created_at: string;
}

const emptyForm = { image_url: "", alt_text: "", size: "normal", sort_order: 0 };

// Rotating size pattern for visual variety
const SIZE_PATTERN: string[] = ["wide", "normal", "normal", "tall", "normal", "wide", "normal", "normal"];

function getAutoSize(index: number): string {
  return SIZE_PATTERN[index % SIZE_PATTERN.length];
}

export default function GalleryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk upload state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.image_url) throw new Error("Image is required");
      const payload = {
        image_url: form.image_url,
        alt_text: form.alt_text || "",
        size: form.size,
        sort_order: form.sort_order,
      };
      if (editId) {
        const { error } = await supabase.from("gallery_images").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery_images").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Image updated" : "Image added" });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Image deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setOpen(false); };

  const openEdit = (img: GalleryImage) => {
    setForm({ image_url: img.image_url, alt_text: img.alt_text, size: img.size, sort_order: img.sort_order });
    setEditId(img.id);
    setOpen(true);
  };

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  // --- Bulk Upload Logic ---
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      toast({ title: "No valid images", description: "Select image files under 5MB each.", variant: "destructive" });
      return;
    }

    setBulkUploading(true);
    setBulkProgress({ done: 0, total: validFiles.length });

    // Determine the starting sort_order and size offset from existing images
    const maxSort = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;
    const sizeOffset = images.length; // continue the pattern from where existing images left off

    const rows: { image_url: string; alt_text: string; size: string; sort_order: number }[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop();
      const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("hotel-uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        toast({ title: `Failed: ${file.name}`, description: uploadError.message, variant: "destructive" });
        setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("hotel-uploads").getPublicUrl(fileName);

      rows.push({
        image_url: publicUrl,
        alt_text: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        size: getAutoSize(sizeOffset + i),
        sort_order: maxSort + 1 + i,
      });

      setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("gallery_images").insert(rows);
      if (error) {
        toast({ title: "DB Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `${rows.length} image${rows.length > 1 ? "s" : ""} added` });
        queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      }
    }

    setBulkUploading(false);
    setBulkOpen(false);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

  const sizeBadgeColor: Record<string, string> = {
    normal: "bg-muted text-muted-foreground",
    wide: "bg-accent/20 text-accent",
    tall: "bg-primary/20 text-primary",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Gallery Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>

          {/* Bulk Upload */}
          <Dialog open={bulkOpen} onOpenChange={(v) => { if (!v && !bulkUploading) setBulkOpen(false); else setBulkOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Images className="h-4 w-4 mr-1" /> Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Images</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Select multiple images at once. Sizes (normal, wide, tall) will be auto-assigned in a mixed pattern for visual variety.
                </p>
                <input
                  ref={bulkFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkUpload}
                  className="hidden"
                />
                {bulkUploading ? (
                  <div className="space-y-2">
                    <Progress value={(bulkProgress.done / bulkProgress.total) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Uploading {bulkProgress.done} / {bulkProgress.total}…
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => bulkFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Choose Images
                  </Button>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={bulkUploading}>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Single Add */}
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Image</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Image" : "Add Image"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <ImageUpload value={form.image_url} onChange={(url) => set("image_url", url)} folder="gallery" label="Upload Gallery Image" />
                <div className="space-y-1">
                  <Label>Alt Text</Label>
                  <Input value={form.alt_text} onChange={(e) => set("alt_text", e.target.value)} placeholder="Describe the image" />
                </div>
                <div className="space-y-1">
                  <Label>Size</Label>
                  <Select value={form.size} onValueChange={(v) => set("size", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (1×1)</SelectItem>
                      <SelectItem value="wide">Wide (2×1)</SelectItem>
                      <SelectItem value="tall">Tall (1×2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <p>No gallery images yet. Click "Add Image" or "Bulk Upload" to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden group relative">
              <img src={img.image_url} alt={img.alt_text} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => openEdit(img)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => setDeleteId(img.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate flex-1">{img.alt_text || "No alt text"}</span>
                <Badge className={`ml-2 text-[10px] ${sizeBadgeColor[img.size] || ""}`}>{img.size}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the image from the gallery.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}