import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Dumbbell } from "lucide-react";
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
import { defaultExerciseMasters, exerciseCategories, type ExerciseMaster } from "@/lib/dummyData";
import { toast } from "sonner";

const TrainerExerciseManager = () => {
  const [exercises, setExercises] = useState<ExerciseMaster[]>(defaultExerciseMasters);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(exerciseCategories[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (exercises.some((e) => e.name === newName.trim())) {
      toast.error("同じ名前の種目が既に存在します");
      return;
    }
    const newEx: ExerciseMaster = {
      id: `ex-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
    };
    setExercises([...exercises, newEx]);
    setNewName("");
    toast.success(`「${newEx.name}」を追加しました`);
  };

  const handleDelete = (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    setExercises(exercises.filter((e) => e.id !== id));
    toast.success(`「${ex?.name}」を削除しました`);
  };

  const startEdit = (ex: ExerciseMaster) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditCategory(ex.category);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editingId) return;
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

  const grouped = exerciseCategories.reduce((acc, cat) => {
    const items = filtered.filter((e) => e.category === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: ExerciseMaster[] }[]);

  return (
    <div className="pb-20 md:pb-0 space-y-5 slide-up">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center">
          <Dumbbell className="w-4.5 h-4.5 text-accent-foreground" />
        </div>
        <h1 className="text-lg font-bold">種目マスター管理</h1>
        <span className="text-xs text-muted-foreground ml-1">（{exercises.length}種目）</span>
      </div>

      {/* Add new exercise */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            新しい種目を追加
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="種目名（例：ラテラルレイズ）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full sm:w-36">
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
            <Button onClick={handleAdd} className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter by category */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-muted-foreground">カテゴリ:</span>
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
                <CardContent className="p-3 flex items-center gap-3">
                  {editingId === ex.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="w-28 h-8 text-xs">
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
                      <button onClick={saveEdit} className="text-success hover:text-success/80">
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Dumbbell className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium flex-1">{ex.name}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                        {ex.category}
                      </span>
                      <button
                        onClick={() => startEdit(ex)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
