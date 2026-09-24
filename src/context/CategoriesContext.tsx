import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fallbackCategory,
  type Category,
} from '../constants/categories';
import {
  addCategory as svcAdd,
  deleteCategory as svcDelete,
  ensureCategoryTable,
  loadCategories,
  updateCategory as svcUpdate,
} from '../services/categoryService';

type CategoriesContextValue = {
  categories: Category[];
  loading: boolean;
  /** Sync lookup — falls back to humanized key if not found. */
  getCategory: (key: string) => Category;
  addCategory: (c: Omit<Category, 'isDefault'>) => Promise<void>;
  updateCategory: (
    key: string,
    patch: Partial<Omit<Category, 'key' | 'isDefault'>>,
  ) => Promise<void>;
  deleteCategory: (key: string) => Promise<void>;
  reload: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    await ensureCategoryTable();
    setCategories(await loadCategories());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const value = useMemo<CategoriesContextValue>(() => {
    const byKey = new Map(categories.map((c) => [c.key, c]));

    return {
      categories,
      loading,
      getCategory: (key) => byKey.get(key) ?? fallbackCategory(key),

      addCategory: async (c) => {
        await svcAdd(c);
        await reload();
      },
      updateCategory: async (key, patch) => {
        await svcUpdate(key, patch);
        await reload();
      },
      deleteCategory: async (key) => {
        await svcDelete(key);
        await reload();
      },
      reload,
    };
  }, [categories, loading, reload]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategories must be used inside <CategoriesProvider>');
  }
  return ctx;
}

/** Convenience hook for a single category. */
export function useCategory(key: string): Category {
  const ctx = useContext(CategoriesContext);
  return ctx ? ctx.getCategory(key) : fallbackCategory(key);
}