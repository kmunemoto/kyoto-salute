import { useState, useRef } from "react";
import { Camera, Plus, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { photos } from "@/lib/dummyData";
import { toast } from "sonner";

const placeholderColors = [
  "from-primary/20 to-accent/20",
  "from-accent/20 to-warning/20",
  "from-info/20 to-primary/20",
  "from-success/20 to-info/20",
];

const CustomerPhotos = () => {
  const [photoList, setPhotoList] = useState(photos);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPhoto = {
        id: String(Date.now()),
        url: URL.createObjectURL(file),
        date: new Date().toISOString().split("T")[0],
        note: "新しい写真",
      };
      setPhotoList((prev) => [...prev, newPhoto]);
      toast.success("写真をアップロードしました！");
    }
    e.target.value = "";
  };

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent" />
            ボディ写真
          </h1>
          <p className="text-sm text-muted-foreground mt-1">変化を記録しましょう</p>
        </div>
        <Button variant="accent" size="sm" onClick={handleUpload}>
          <Plus className="w-4 h-4" />
          追加
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {photoList.map((photo, i) => (
          <Card key={photo.id} className="card-hover overflow-hidden">
            <div className="aspect-[3/4] relative">
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.note}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${placeholderColors[i % placeholderColors.length]} flex items-center justify-center`}>
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
                <p className="text-primary-foreground text-xs font-bold">{photo.note}</p>
                <p className="text-primary-foreground/70 text-[10px]">{photo.date}</p>
              </div>
            </div>
          </Card>
        ))}

        {/* Upload Placeholder */}
        <button
          onClick={handleUpload}
          className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Plus className="w-6 h-6 text-accent" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">写真を追加</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerPhotos;
