import { useState, useEffect } from "react";
import { api } from "../../services/api";

const DEFAULTS = { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 250, dailyFat: 65 };

export function useGoals() {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getGoals();
        const g = res.data;
        setCalories(String(g.dailyCalories));
        setProtein(String(g.dailyProtein));
        setCarbs(String(g.dailyCarbs));
        setFat(String(g.dailyFat));
      } catch {
        setCalories(String(DEFAULTS.dailyCalories));
        setProtein(String(DEFAULTS.dailyProtein));
        setCarbs(String(DEFAULTS.dailyCarbs));
        setFat(String(DEFAULTS.dailyFat));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    const values = {
      dailyCalories: Number(calories),
      dailyProtein: Number(protein),
      dailyCarbs: Number(carbs),
      dailyFat: Number(fat),
    };
    if (Object.values(values).some((v) => isNaN(v) || v < 0)) {
      setError("All values must be valid numbers >= 0");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.upsertGoals(values);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Failed to save goals");
    } finally {
      setSaving(false);
    }
  };

  return { calories, setCalories, protein, setProtein, carbs, setCarbs, fat, setFat, loading, saving, error, success, save };
}
