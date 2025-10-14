import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/msw'

const sampleContract = {
  id: '1',
  contract_code: 'C-001',
  client_name: 'Cliente XPTO',
  cnpj: '00.000.000/0000-00',
  segment: 'Comercial',
  contact_responsible: 'Fulano',
  contracted_volume_mwh: 100,
  status: 'ativo',
  energy_source: 'convencional',
  contracted_modality: 'livre',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  billing_cycle: '2024-01',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-02T00:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('contracts service', () => {
  it('uses the Vite proxy in development and performs a body-less GET', async () => {
    vi.stubEnv('DEV', 'true')
    vi.stubEnv('VITE_USE_PROXY', 'true')
    vi.stubEnv('VITE_API_BASE_URL', '')

    const requestUrls: string[] = []

    server.use(
      http.get('/api/contracts', async ({ request }) => {
        requestUrls.push(new URL(request.url).pathname)
        const body = await request.text()
        expect(body).toBe('')
        return HttpResponse.json([sampleContract])
      })
    )

    const { listContracts } = await import('./contracts')
    const contracts = await listContracts()

    expect(requestUrls).toEqual(['/api/contracts'])
    expect(contracts).toHaveLength(1)
    expect(contracts[0]).toMatchObject({
      id: '1',
      contract_code: 'C-001',
      client_name: 'Cliente XPTO',
    })
  })

  it('uses the configured base URL when proxy is disabled', async () => {
    vi.stubEnv('DEV', 'false')
    vi.stubEnv('VITE_USE_PROXY', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'http://example.com')

    const requestUrls: string[] = []

    server.use(
      http.get('http://example.com/contracts', async ({ request }) => {
        requestUrls.push(request.url)
        const body = await request.text()
        expect(body).toBe('')
        return HttpResponse.json({ data: [sampleContract] })
      })
    )

    const { listContracts } = await import('./contracts')
    const contracts = await listContracts()

    expect(requestUrls).toEqual(['http://example.com/contracts'])
    expect(contracts).toHaveLength(1)
    expect(contracts[0].id).toBe('1')
  })
})
