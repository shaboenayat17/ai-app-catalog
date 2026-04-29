"use client";

import { useCallback, useEffect, useState } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { getPersonaById, type Persona } from "@/lib/personas";

export function usePersona() {
  const [personaId, setPersonaIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = storage.get<string | null>(STORAGE_KEYS.persona, null);
    if (stored) setPersonaIdState(stored);
  }, []);

  const setPersonaId = useCallback((id: string | null) => {
    setPersonaIdState(id);
    if (id) storage.set(STORAGE_KEYS.persona, id);
    else storage.remove(STORAGE_KEYS.persona);
  }, []);

  const persona: Persona | null = getPersonaById(personaId);

  return { personaId, persona, setPersonaId };
}
