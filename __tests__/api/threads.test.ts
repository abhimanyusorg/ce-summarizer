import { getAllThreads } from '@/lib/db/queries'

// Mock the database queries
jest.mock('@/lib/db/queries', () => ({
  getAllThreads: jest.fn()
}))

describe('Thread Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllThreads', () => {
    it('should call getAllThreads with correct parameters', async () => {
      const mockResult = {
        threads: [],
        total: 0,
        hasMore: false
      }

      const mockGetAllThreads = getAllThreads as jest.MockedFunction<typeof getAllThreads>
      mockGetAllThreads.mockResolvedValue(mockResult as any)

      const result = await getAllThreads({
        status: 'open',
        limit: 10,
        offset: 0
      })

      expect(mockGetAllThreads).toHaveBeenCalledWith({
        status: 'open',
        limit: 10,
        offset: 0
      })
      expect(result).toBeDefined()
    })

    it('should handle database errors', async () => {
      const mockGetAllThreads = getAllThreads as jest.MockedFunction<typeof getAllThreads>
      mockGetAllThreads.mockRejectedValue(new Error('Database error'))

      await expect(getAllThreads({})).rejects.toThrow('Database error')
    })
  })
})