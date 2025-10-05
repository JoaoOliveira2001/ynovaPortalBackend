import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContracts } from '../useContracts';

declare global {
  // eslint-disable-next-line no-var
  var fetch: typeof globalThis.fetch;
}

const ORIGINAL_FETCH = global.fetch;

const mockSuccessResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);

const mockErrorResponse = (status: number) =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  } as Response);

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  global.fetch = ORIGINAL_FETCH;
});

describe('useContracts', () => {
  it('returns contracts from the API', async () => {
    vi.stubEnv('VITE_CONTRACTS_URL', 'https://example.com/contracts');
    const mockFetch = vi
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        mockSuccessResponse([
          {
            id: 1,
            client: 'Cliente testeNgrok',
            contract: 987654321,
            price: 123.56,
            reference_base: '2024-10-01',
            supplier: 'Fornecedor A',
            contact_active: true,
          },
        ])
      );

    const { result } = renderHook(() => useContracts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/contracts',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toMatchObject({
      customerName: 'Cliente testeNgrok',
      contractNumber: '987654321',
      status: 'ATIVO',
      amount: 123.56,
      supplier: 'Fornecedor A',
      startDate: '2024-10-01',
    });

    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        data: [],
      })
    );

    await result.current.refresh();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(0);
  });

  it('handles empty responses gracefully', async () => {
    vi.stubEnv('VITE_CONTRACTS_URL', 'https://example.com/contracts');
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      mockSuccessResponse({
        data: [],
      })
    );

    const { result } = renderHook(() => useContracts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toHaveLength(0);
    expect(result.current.error).toBeUndefined();
  });

  it('captures API errors', async () => {
    vi.stubEnv('VITE_CONTRACTS_URL', 'https://example.com/contracts');
    vi.spyOn(global, 'fetch').mockImplementation(() => mockErrorResponse(500));

    const { result } = renderHook(() => useContracts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toHaveLength(0);
    expect(result.current.error).toBeDefined();
  });
});
