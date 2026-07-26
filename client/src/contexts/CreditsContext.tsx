import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface CreditsContextType {
  balance: number;
  totalPurchased: number;
  totalEarned: number;
  totalSpent: number;
  isLoading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  spendCredits: (amount: number, description: string) => Promise<boolean>;
  purchaseCredits: (packId: number) => Promise<boolean>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

interface CreditsProviderProps {
  children: React.ReactNode;
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  const [balance, setBalance] = useState<number>(0);
  const [totalPurchased, setTotalPurchased] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const credits = await trpc.credits.getBalance.query();
      setBalance(credits.balance);
      setTotalPurchased(credits.totalPurchased);
      setTotalEarned(credits.totalEarned);
      setTotalSpent(credits.totalSpent);
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED" || err?.data?.code === "UNAUTHORIZED") {
        setBalance(0);
        setTotalPurchased(0);
        setTotalEarned(0);
        setTotalSpent(0);
        setError(null);
      } else {
        console.error("Failed to fetch credits:", err);
        setError("Failed to load credits");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const spendCredits = useCallback(async (amount: number, description: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await trpc.credits.spend.mutate({
        amount,
        description,
      });
      
      if (result.success) {
        setBalance(result.newBalance);
        setTotalSpent(prev => prev + amount);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to spend credits:", err);
      setError(err instanceof Error ? err.message : "Failed to spend credits");
      return false;
    }
  }, []);

  const purchaseCredits = useCallback(async (packId: number): Promise<boolean> => {
    try {
      setError(null);
      const result = await trpc.credits.purchaseCredits.mutate({
        packId,
      });
      
      if (result.success) {
        setBalance(result.newBalance);
        setTotalPurchased(prev => prev + result.creditsAdded);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to purchase credits:", err);
      setError(err instanceof Error ? err.message : "Failed to purchase credits");
      return false;
    }
  }, []);

  // Load credits on mount
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  return (
    <CreditsContext.Provider
      value={{
        balance,
        totalPurchased,
        totalEarned,
        totalSpent,
        isLoading,
        error,
        refreshCredits,
        spendCredits,
        purchaseCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within CreditsProvider");
  }
  return context;
}
