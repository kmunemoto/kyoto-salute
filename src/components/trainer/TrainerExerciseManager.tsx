import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Dumbbell, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exerciseCategories } from "@/lib/dummyData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

const TrainerExerciseManager = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(exerciseCategories[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("category")
      .order("name");
    if (error) {
      toast.error("種目の取得に失敗しました");
    } else {
      setExercises(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    if (exercises.some((e) => e.name === newName.trim())) {
      toast.error("同じ名前の種目が既に存在します");
      return;
    }
    const { data, error } = await supabase
      .from("exercises")
      .insert({ name: newName.trim(), category: newCategory })
      .select()
      .single();
    if (error) {
      toast.error("追加に失敗しました");
      return;
    }
    setExercises([...exercises, data]);
    setNewName("");
    toast.success(`「${data.name}」を追加しました`);
  };

  const handleDelete = async (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setExercises(exercises.filter((e) => e.id !== id));
    toast.success(`「${ex?.name}」を削除しました`);
  };

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditCategory(ex.category);
  };

  const saveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    const { error } = await supabase
      .from("exercises")
      .update({ name: editName.trim(), category: editCategory })
      .eq("id", editingId);
    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    setExercises(
      exercises.map((e) =>
        e.id === editingId ? { ...e, name: editName.trim(), category: editCategory } : e
      )
    );
    toast.success("種目を更新しました");
    setEditingId(null);
  };

  const filtered =
    filterCategory === "all" ? exercises : exercises.filter((e) => e.category === filterCategory);

  const grouped = [...exerciseCategories].reduce((acc, cat) => {
    const items = filtered.filter((e) => e.category === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: Exercise[] }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0 space-y-4 sm:space-y-5 slide-up">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shrink-0">
          <Dumbbell className="w-4.5 h-4.5 text-accent-foreground" />
        </div>
        <h1 className="text-lg font-bold">種目マスター管理</h1>
        <span className="text-xs text-muted-foreground ml-1">（{exercises.length}種目）</span>
      </div>

      {/* Add new exercise */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            新しい種目を追加
          </h2>
          <div className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
            <Input
              placeholder="種目名（例：ラテラルレイズ）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 h-11"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full sm:w-36 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exerciseCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} className="gap-1.5 shrink-0 w-full sm:w-auto h-11">
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter by category */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="text-xs font-bold text-muted-foreground">カテゴリ:</span>
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
            filterCategory === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          すべて
        </button>
        {exerciseCategories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
              filterCategory === c
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Exercise list grouped by category */}
      {grouped.map(({ category, items }) => (
        <section key={category}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {category}（{items.length}）
          </h2>
          <div className="space-y-1.5">
            {items.map((ex) => (
              <Card key={ex.id} className="card-hover">
                <CardContent className="p-3 flex items-center gap-2 sm:gap-3">
                  {editingId === ex.id ? (
                    <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-10 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                      <div className="flex gap-2">
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="w-full sm:w-28 h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {exerciseCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button onClick={saveEdit} className="text-success hover:text-success/80 p-2">
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-muted-foreground hover:text-foreground p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Dumbbell className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">{ex.name}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 shrink-0 hidden sm:inline">
                        {ex.category}
                      </span>
                      <button
                        onClick={() => startEdit(ex)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-2"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8">
          該当する種目がありません
        </div>
      )}
    </div>
  );
};

export default TrainerExerciseManager;
