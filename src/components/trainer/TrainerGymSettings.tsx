import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGymSettings } from "@/hooks/useGymSettings";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, Image, User, Save } from "lucide-react";

const TrainerGymSettings = () => {
  const { settings, updateLogoUrl, refetch } = useGymSettings();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);
    if (error) {
      toast.error("名前の保存に失敗しました");
    } else {
      toast.success("表示名を更新しました");
    }
    setSavingName(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ファイルサイズは2MB以下にしてください");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `logo_${Date.now()}.${ext}`;

      await supabase.storage.from("gym-assets").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("gym-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gym-assets")
        .getPublicUrl(filePath);

      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      const err = await updateLogoUrl(url);
      if (err) throw err;

      toast.success("ロゴを更新しました");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      const { data: files } = await supabase.storage.from("gym-assets").list();
      if (files && files.length > 0) {
        const logoFiles = files.filter((f) => f.name.startsWith("logo"));
        if (logoFiles.length > 0) {
          await supabase.storage.from("gym-assets").remove(logoFiles.map((f) => f.name));
        }
      }

      const err = await updateLogoUrl(null);
      if (err) throw err;

      toast.success("ロゴを削除しました");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "削除に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-0">
      <h2 className="text-lg sm:text-xl font-black">ジム基本設定</h2>

      {/* トレーナープロフィール */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <User className="w-5 h-5" />
            トレーナー表示名
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2 space-y-3">
          <p className="text-xs text-muted-foreground">ダッシュボードや顧客のチャット画面に表示される名前です。</p>
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例：山本 太郎"
                className="flex-1"
              />
              <Button onClick={handleSaveName} disabled={savingName || !displayName.trim()} className="h-10">
                <Save className="w-4 h-4 mr-1" />
                {savingName ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Image className="w-5 h-5" />
            ロゴ画像
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2 space-y-4">
          {/* Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="ジムロゴ"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">未設定</span>
              )}
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="text-sm font-semibold">現在のロゴ</p>
              <p className="text-xs text-muted-foreground">
                推奨サイズ: 200×200px以上、2MB以下
              </p>
              <p className="text-xs text-muted-foreground">
                対応形式: PNG, JPG, SVG, WebP
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 h-11"
            >
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "処理中..." : settings?.logo_url ? "画像を変更" : "画像をアップロード"}
            </Button>
            {settings?.logo_url && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={uploading}
                className="h-11"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerGymSettings;
