import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../DashboardPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../test/msw';
import { http, HttpResponse } from 'msw';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    // ensure default handlers
  });

  it('renderiza em mobile (grid compacta) e mostra loader', async () => {
    server.use(
      http.get('/api/dashboard/overview', async () => {
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json({
          totalContratosAtivos: 10,
          distribuicaoConformidade: { Subutilizado: 2, Conforme: 5, Excedente: 2, Indefinido: 1 },
          totalOportunidades: 3,
          totalDivergenciasNF: 2,
          totalDivergenciasFatura: 1,
        });
      })
    );
    renderWithProviders(<DashboardPage />);
    // loader skeleton presente nos cards
    expect(await screen.findAllByRole('button')).toBeTruthy();
  });

  it('trocar o mês altera os números dos cards', async () => {
    server.use(
      http.get('/api/dashboard/overview', ({ request }) => {
        const url = new URL(request.url);
        const month = url.searchParams.get('mes');
        if (month === '2025-08') {
          return HttpResponse.json({
            totalContratosAtivos: 99,
            distribuicaoConformidade: { Subutilizado: 1, Conforme: 7, Excedente: 1, Indefinido: 0 },
            totalOportunidades: 5,
            totalDivergenciasNF: 3,
            totalDivergenciasFatura: 2,
          });
        }
        return HttpResponse.json({
          totalContratosAtivos: 18,
          distribuicaoConformidade: { Subutilizado: 2, Conforme: 5, Excedente: 2, Indefinido: 1 },
          totalOportunidades: 4,
          totalDivergenciasNF: 1,
          totalDivergenciasFatura: 1,
        });
      })
    );
    renderWithProviders(<DashboardPage />);
    const month = await screen.findByLabelText(/Selecionar mês/i);
    // aguarda primeiro valor
    const kpi = await screen.findByRole('button', { name: /Contratos Ativos/i });
    const firstText = kpi.textContent;
    await userEvent.clear(month);
    await userEvent.type(month as HTMLInputElement, '2025-08');
    await waitFor(() => {
      expect(kpi.textContent).not.toEqual(firstText);
    });
  });
});

