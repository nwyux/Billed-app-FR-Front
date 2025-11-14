/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
// integration GET: mock store used by router (lowercase path & mock* variable to satisfy jest scope rules)
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("When I click on NewBill button Then I should navigate to NewBill page", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = jest.fn()
      const billsContainer = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      const newBillButton = screen.getByTestId('btn-new-bill')
      userEvent.click(newBillButton)
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
      // ensure container method triggers navigation without errors
    })

    test("When I click on first eye icon Then a modal should open with the bill image", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = BillsUI({ data: bills })
      // mock bootstrap modal function to avoid errors
      $.fn.modal = jest.fn()
      const onNavigate = jest.fn()
      new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      const firstEye = screen.getAllByTestId('icon-eye')[0]
      userEvent.click(firstEye)
      expect($.fn.modal).toHaveBeenCalledWith('show')
      const modalBody = document.querySelector('#modaleFile .modal-body')
      expect(modalBody.innerHTML).toMatch(/img/)
      const img = modalBody.querySelector('img')
      expect(img).toBeTruthy()
      expect(img.getAttribute('src')).toBe(firstEye.getAttribute('data-bill-url'))
      expect(img.getAttribute('alt')).toBe('Bill')
    })

    test("getBills should return formatted bills", async () => {
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
      const data = await billsInstance.getBills()
      expect(data.length).toBeGreaterThan(0)
      // formatted date pattern (e.g., 4 Avr. 04)
      const formattedDateRegex = /^\d{1,2} [A-Z][a-z]{2}\. \d{2}$/
      expect(formattedDateRegex.test(data[0].date)).toBeTruthy()
    })

    test("getBills should handle corrupted date and keep original", async () => {
      const corruptedStore = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: '1', date: 'not-a-valid-date', status: 'pending', amount: 100, type: 'Test', name: 'Bad', fileUrl: 'http://localhost/bad.jpg' }
          ])
        })
      }
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: corruptedStore, localStorage: window.localStorage })
      const data = await billsInstance.getBills()
      expect(data[0].date).toBe('not-a-valid-date')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test("getBills should return undefined when store is not provided", () => {
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage })
      expect(billsInstance.getBills()).toBeUndefined()
    })

    // test d'intégration GET Bills
    describe("When I navigate to Bills", () => {
      test("fetches bills from mock API GET and displays them", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        const root = document.createElement('div')
        root.setAttribute('id','root')
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        // Wait for table body to be populated
        await waitFor(() => screen.getByTestId('tbody'))
        const rows = screen.getByTestId('tbody').querySelectorAll('tr')
        expect(rows.length).toBeGreaterThan(0)
        // Eye icons present for each bill action
        const eyes = screen.getAllByTestId('icon-eye')
        expect(eyes.length).toBe(rows.length)
        // New bill button present
        expect(screen.getByTestId('btn-new-bill')).toBeTruthy()
      })
      test("constructor without bill button or eye icons should not throw (false branch coverage)", () => {
        document.body.innerHTML = `<div id='root'><div></div></div>`
        const onNavigate = jest.fn()
        expect(() => new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })).not.toThrow()
      })
    })
  })
})

// Additional render branch coverage for BillsUI (loading & error)
describe("BillsUI render conditional branches", () => {
  test("When loading is true Then LoadingPage is returned", () => {
    document.body.innerHTML = BillsUI({ data: [], loading: true, error: null })
    expect(screen.getByText(/Loading/i)).toBeTruthy()
  })
  test("When error is set Then ErrorPage is returned", () => {
    document.body.innerHTML = BillsUI({ data: [], loading: false, error: 'Erreur test' })
    expect(screen.getByText(/Erreur test/i)).toBeTruthy()
  })
})
