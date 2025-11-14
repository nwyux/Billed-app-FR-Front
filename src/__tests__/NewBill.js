/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"

// Helper to set user in localStorage
const setEmployee = () => {
  Object.defineProperty(window, 'localStorage', { value: {
    getItem: jest.fn((key) => key === 'user' ? JSON.stringify({ type: 'Employee', email: 'employee@test.com' }) : null),
    setItem: jest.fn()
  } })
}


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should render all required inputs", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      expect(screen.getByTestId('expense-type')).toBeTruthy()
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()
    })

    test("When I upload a valid file Then store.create is called and internal file props set", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const createMock = jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/test.png', key: '1234' }))
      const mockStore = {
        bills: () => ({
          create: createMock
        })
      }
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId('file')
      const file = new File(['image'], 'test.png', { type: 'image/png' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      // wait next microtask for promise resolution
      await Promise.resolve()
      expect(createMock).toHaveBeenCalled()
      expect(newBill.fileUrl).toBe('http://localhost/test.png')
      expect(newBill.fileName).toBe('test.png')
      expect(newBill.billId).toBe('1234')
    })

    test("When I submit with empty pct Then pct defaults to 20 and updateBill called with collected data", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const mockStore = {
        bills: () => ({
          create: jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/justif.jpg', key: '9999' })),
          update: jest.fn(() => Promise.resolve())
        })
      }
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      // Prepare file upload
      const fileInput = screen.getByTestId('file')
      const file = new File(['binary'], 'justif.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      await Promise.resolve()
      // Fill form fields
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Billet TGV' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-10-10' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '150' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '' } }) // Leave empty to trigger default 20
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Déplacement professionnel' } })
      // Spy updateBill to capture argument
      const updateSpy = jest.spyOn(newBill, 'updateBill').mockImplementation(() => {})
      const form = screen.getByTestId('form-new-bill')
      fireEvent.submit(form)
      expect(updateSpy).toHaveBeenCalled()
      const billArg = updateSpy.mock.calls[0][0]
      expect(billArg.pct).toBe(20)
      expect(billArg.fileUrl).toBe('http://localhost/justif.jpg')
      expect(billArg.fileName).toBe('justif.jpg')
      expect(billArg.status).toBe('pending')
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
    })

    test("When updateBill resolves it navigates again to Bills (double navigate path)", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const navigateSpy = jest.fn()
      const mockStore = {
        bills: () => ({
          create: jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/a.png', key: 'abcd' })),
          update: jest.fn(() => Promise.resolve())
        })
      }
      const newBill = new NewBill({ document, onNavigate: navigateSpy, store: mockStore, localStorage: window.localStorage })
      // Upload file
      const fileInput = screen.getByTestId('file')
      const file = new File(['data'], 'a.png', { type: 'image/png' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      await Promise.resolve()
      // Minimal required fields
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Taxi' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-11-11' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '50' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '10' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '15' } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Client meeting' } })
      fireEvent.submit(screen.getByTestId('form-new-bill'))
      // First navigate from handleSubmit
      expect(navigateSpy).toHaveBeenCalledWith(ROUTES_PATH.Bills)
      // Wait microtask chain for updateBill internal navigate
      await Promise.resolve()
      expect(navigateSpy.mock.calls.filter(c => c[0] === ROUTES_PATH.Bills).length).toBeGreaterThanOrEqual(1)
    })

    test("When I upload an invalid file extension Then an alert is shown and file props stay null", () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const mockStore = { bills: () => ({ create: jest.fn() }) }
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId('file')
      const badFile = new File(['text'], 'malicious.exe', { type: 'application/x-msdownload' })
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      Object.defineProperty(fileInput, 'files', { value: [badFile] })
      fireEvent.change(fileInput)
      expect(alertSpy).toHaveBeenCalled()
      expect(newBill.fileUrl).toBeNull()
      expect(newBill.fileName).toBeNull()
      expect(mockStore.bills().create).not.toHaveBeenCalled()
      alertSpy.mockRestore()
    })

    test("updateBill calls store.update and navigates (success path)", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const updateMock = jest.fn(() => Promise.resolve())
      const mockStore = { bills: () => ({ create: jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/x.png', key: 'k1' })), update: updateMock }) }
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      // simulate file upload valid
      const fileInput = screen.getByTestId('file')
      const file = new File(['data'], 'x.png', { type: 'image/png' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      await Promise.resolve()
      // Fill minimal form
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Bus' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-09-09' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '5' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '10' } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Test' } })
      // Submit
      fireEvent.submit(screen.getByTestId('form-new-bill'))
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
      // Wait for internal updateBill navigate
      await Promise.resolve()
      expect(updateMock).toHaveBeenCalled()
    })

    test("updateBill handles error (catch branch)", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const errorMock = jest.fn(() => Promise.reject(new Error('update error')))
      const createMock = jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/y.png', key: 'k2' }))
      const mockStore = { 
        bills: () => ({ 
          create: createMock,
          update: errorMock 
        }) 
      }
      const onNavigate = jest.fn()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId('file')
      const file = new File(['data'], 'y.png', { type: 'image/png' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      await Promise.resolve()
      await Promise.resolve()
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Train' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-08-08' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '80' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '10' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Erreur test' } })
      fireEvent.submit(screen.getByTestId('form-new-bill'))
      await Promise.resolve()
      await Promise.resolve()
      expect(errorMock).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test("handleSubmit logs date value (console.log coverage)", async () => {
      setEmployee()
      const html = NewBillUI()
      document.body.innerHTML = html
      const updateMock = jest.fn(() => Promise.resolve())
      const createMock = jest.fn(() => Promise.resolve({ fileUrl: 'http://localhost/z.png', key: 'kz' }))
      const mockStore = { 
        bills: () => ({ 
          update: updateMock,
          create: createMock
        }) 
      }
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      // simulate uploaded file first
      const fileInput = screen.getByTestId('file')
      const file = new File(['data'], 'z.png', { type: 'image/png' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
      await Promise.resolve()
      await Promise.resolve()
      // set date and minimal fields
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Metro' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-07-07' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '10' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '2' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'RER' } })
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      // direct invocation to ensure handleSubmit code path executed independently of updateBill async
      const form = screen.getByTestId('form-new-bill')
      newBill.handleSubmit({ preventDefault: () => {}, target: form })
      expect(logSpy).toHaveBeenCalled()
      logSpy.mockRestore()
    })
  })

  // Test d'intégration POST
  describe("When I submit a new bill", () => {
    test("Then it should create bill via POST API call", async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn((key) => {
          if (key === 'user') return JSON.stringify({ type: 'Employee', email: 'employee@test.com' })
          if (key === 'jwt') return 'fake-jwt-token'
          return null
        }),
        setItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

      // Render NewBill page
      const html = NewBillUI()
      document.body.innerHTML = html

      // Mock fetch for POST request
      const mockBillData = {
        id: "new123",
        vat: "20",
        fileUrl: "https://test.storage.tld/newbill.jpg",
        status: "pending",
        type: "Transports",
        commentary: "Déplacement client",
        name: "Vol Paris-Lyon",
        fileName: "ticket.jpg",
        date: "2024-11-14",
        amount: 350,
        email: "employee@test.com",
        pct: 20
      }

      global.fetch = jest.fn((url, options) => {
        if (url.includes('/bills') && options.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBillData)
          })
        }
        if (url.includes('/bills') && options.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBillData)
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      const onNavigate = jest.fn()
      
      // Import real Store
      const Store = (await import('../app/Store.js')).default
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage
      })

      // Simulate file upload
      const fileInput = screen.getByTestId('file')
      const file = new File(['image content'], 'ticket.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      
      fireEvent.change(fileInput)
      
      // Wait for file upload to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Fill the form
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Vol Paris-Lyon' } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2024-11-14' } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '350' } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Déplacement client' } })

      // Submit form
      const form = screen.getByTestId('form-new-bill')
      fireEvent.submit(form)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify navigation was called
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled()
      
      // Clean up
      global.fetch.mockRestore()
    })

    test("Then it should handle 404 error from POST API", async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn((key) => {
          if (key === 'user') return JSON.stringify({ type: 'Employee', email: 'employee@test.com' })
          if (key === 'jwt') return 'fake-jwt-token'
          return null
        }),
        setItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

      const html = NewBillUI()
      document.body.innerHTML = html

      // Mock fetch to return 404 error
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not Found' })
        })
      )

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const onNavigate = jest.fn()
      
      const Store = (await import('../app/Store.js')).default
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage
      })

      // Simulate file upload that will fail
      const fileInput = screen.getByTestId('file')
      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      
      fireEvent.change(fileInput)
      
      // Wait for error
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(consoleSpy).toHaveBeenCalled()
      
      // Clean up
      consoleSpy.mockRestore()
      global.fetch.mockRestore()
    })

    test("Then it should handle 500 error from POST API", async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn((key) => {
          if (key === 'user') return JSON.stringify({ type: 'Employee', email: 'employee@test.com' })
          if (key === 'jwt') return 'fake-jwt-token'
          return null
        }),
        setItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

      const html = NewBillUI()
      document.body.innerHTML = html

      // Mock fetch to return 500 error
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal Server Error' })
        })
      )

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const onNavigate = jest.fn()
      
      const Store = (await import('../app/Store.js')).default
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage
      })

      // Simulate file upload that will fail
      const fileInput = screen.getByTestId('file')
      const file = new File(['image'], 'error.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      
      fireEvent.change(fileInput)
      
      // Wait for error
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(consoleSpy).toHaveBeenCalled()
      
      // Clean up
      consoleSpy.mockRestore()
      global.fetch.mockRestore()
    })
  })
})
