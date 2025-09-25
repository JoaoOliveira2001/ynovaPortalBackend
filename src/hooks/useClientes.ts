import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Cliente } from '../types';
import { fetchClientes } from '../services/clientes';

let cachedClientes: Cliente[] | null = null;

export function clearClientesCache() {
  cachedClientes = null;
}

export function useClientes(initialClientes: Cliente[] = []) {
  const [clientes, setClientesState] = useState<Cliente[]>(() => {
    if (cachedClientes && cachedClientes.length) {
      return cachedClientes;
    }
    if (initialClientes.length) {
      cachedClientes = initialClientes;
      return initialClientes;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => !(cachedClientes && cachedClientes.length));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(!(cachedClientes && cachedClientes.length));
    setError(null);

    fetchClientes(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        cachedClientes = data;
        setClientesState(data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error('Erro inesperado ao carregar clientes'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const setClientes = useCallback<Dispatch<SetStateAction<Cliente[]>>>(
    (updater) => {
      setClientesState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: Cliente[]) => Cliente[])(prev) : updater;
        cachedClientes = next;
        return next;
      });
    },
    [],
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientes();
      cachedClientes = data;
      setClientesState(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro inesperado ao recarregar clientes'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const result = useMemo(
    () => ({ clientes, loading, error, setClientes, refetch }),
    [clientes, loading, error, setClientes, refetch],
  );

  return result;
}
