/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // Test we are on Bills Page ( by icon )
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);


    })

    // Test bills are ordered from earliest to latest
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // W 
    // New test cases added 
    // Test we have data from API
    test("Then get bills from API getBills, bills should have data", async () => {
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage });
      const billsData = await billsInstance.getBills();

      console.log("billsData", billsData);
      expect(billsData).toBeDefined();
      expect(billsData.length).toBeGreaterThan(0);
      expect(billsData[0]).toHaveProperty("date");
      expect(billsData[0]).toHaveProperty("status");
      // ... add more expectations as needed
    });

    // Test we have data from API getBills, but store is undefined
    test("Then get bills from API, but store is undefined, nothing happens", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null, // No store provided
        localStorage: window.localStorage
      });

      const result = await billsInstance.getBills();
      expect(result).toBeUndefined(); // Expect no data to be returned
    });

    // Test we have data from API getBills, but store is corrupted
    test("Then get bills from API, but store is corrupted and thrown a console", async () => {
      const corruptedStore = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: "123", date: "invalid-date", status: "pending", name: "test bill", amount: 100, fileUrl: "#" }
          ])
        })
      }

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { }); // Mock console.log, spy on it

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      });

      const result = await billsInstance.getBills();

      expect(result[0].date).toBe("invalid-date");
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Bill length', 1);

      logSpy.mockRestore();
    });


    // Test we navigate to NewBill page on clicking 'Nouvelle note de frais' ( by icon )
    test("Then clicking on 'Nouvelle note de frais' should calls onNavigate to NewBill", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillBtn);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    // Test when we click on eye icon bill list, it opens a modal with the image
    test("Then clicking on an eye icon opens the modal with the image", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage });

      // Prepare the eye icon
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.setAttribute("data-bill-url", "https://localhost/facture.jpg");

      // Mock jQuery modal
      $.fn.modal = jest.fn();

      fireEvent.click(iconEye);

      // Check that an image is injected into the modal
      const modalContent = document.querySelector(".modal-body").innerHTML;
      expect(modalContent).toContain("img");
      expect($.fn.modal).toHaveBeenCalled();
    });

  })
})