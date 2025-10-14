import React from 'react';
import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../../services/contracts', async () => {
  const { mockContracts } = await import('../../../mocks/contracts');
  return {
    listContracts: vi.fn(async () => mockContracts),
    createContract: vi.fn(async () => mockContracts[0]),
    updateContract: vi.fn(async () => mockContracts[0]),
    deleteContract: vi.fn(async () => {}),
    patchContract: vi.fn(async () => mockContracts[0]),
  };
});

let ContratosPage: React.ComponentType<Record<string, never>>;
let ContractsProvider: React.ComponentType<{ children: React.ReactNode }>;
let contractsFixture: Array<{ codigo: string; cliente: string }>;

beforeAll(async () => {
  const pageModule = await import('..');
  ContratosPage = pageModule.default;
  const contextModule = await import('../ContractsContext');
  ContractsProvider = contextModule.ContractsProvider;
  const { mockContracts } = await import('../../../mocks/contracts');
  contractsFixture = mockContracts.slice(0, 3).map(({ codigo, cliente }) => ({ codigo, cliente }));
});

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ContractsProvider>{ui}</ContractsProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ContratosPage', () => {
  it('lista contratos carregados do serviço compartilhado', async () => {
    renderWithProviders(<ContratosPage />);
    for (const { codigo, cliente } of contractsFixture) {
      expect(await screen.findAllByText(new RegExp(codigo, 'i'))).not.toHaveLength(0);
      expect(await screen.findAllByText(new RegExp(cliente, 'i'))).not.toHaveLength(0);
    }
  });

  it('filtra contratos pela barra de busca', async () => {
    renderWithProviders(<ContratosPage />);
    const search = screen.getByPlaceholderText(/Buscar por código, cliente ou CNPJ/i);
    await userEvent.type(search, contractsFixture[0].codigo);

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((row) => row.textContent?.includes(contractsFixture[0].codigo))).toBe(true);
    });
  });

  it('exibe os resumos de conformidade para cada contrato', async () => {
    renderWithProviders(<ContratosPage />);
    expect(await screen.findAllByText(/Consumo/i)).not.toHaveLength(0);
    expect(await screen.findAllByText(/NF/i)).not.toHaveLength(0);
    expect(await screen.findAllByText(/Fatura/i)).not.toHaveLength(0);
  });
});

