/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

const newbill = [
  {
    vat: "10",
    fileUrl:
      "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
    status: "pending",
    type: "Transports",
    commentary: "Un voyage d'affaires",
    name: "Cher",
    date: "2025-06-04",
    amount: 100,
    commentAdmin: "...",
    email: "a@b.com",
    pct: 80,
  },
];

describe("Given I am connected as an employee", () => {
  let onNavigate;
  let localStorageMock;

  // Mock user
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ email: "employee@test.com" })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES_PATH[pathname] || "";
    };
  });

  describe("When I am on NewBill Page", () => {

    // Test for rendering new bill form
    test("Then the new bill form should be rendered", () => {
      document.body.innerHTML = NewBillUI();

      // What i am expecting to see
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    // Add test when submitting form without valid data
    test("Then submitting the form without valid data should not call updateBill", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      // What i am expecting to see
      expect(handleSubmit).toHaveBeenCalled();
      expect(mockStore.bills().update).not.toHaveBeenCalled();
    });

    // Add test when submitting form with valid data
    test("Then submitting the form with valid data should call updateBill and navigate", async () => {
      document.body.innerHTML = NewBillUI();
      const mockNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate: mockNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // Mock file upload
      newBill.fileUrl = newbill[0].fileUrl;
      newBill.fileName = "test.jpg";
      // Fill form fields using newbill object
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: newbill[0].type },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: newbill[0].name },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: newbill[0].amount.toString() },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: newbill[0].date },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: newbill[0].vat },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: newbill[0].pct.toString() },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: newbill[0].commentary },
      });
      // Submit form
      fireEvent.submit(screen.getByTestId("form-new-bill"));
      expect(mockNavigate).toHaveBeenCalled();
    });

    // Test for rendering the file input
    test("Then uploading a file with invalid extension should show an alert and reset input", () => {
      document.body.innerHTML = NewBillUI();
      // Mock window.alert before the test
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(window.alert).toHaveBeenCalledWith(
        "Veuillez sélectionner un fichier au format jpg, jpeg ou png."
      );
      expect(fileInput.value).toBe("");
      alertMock.mockRestore();
    });

    // Test for uploading a file with valid extension
    test("Then uploading a file with valid extension should call store.bills().create", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy"], "test.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() =>
        expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg")
      );
      expect(newBill.fileName).toBe("test.png");
    });


    // Test for handleChangeFile sets fileUrl, fileName, and billId on success >>>> Test line 34 to 53  
    test("Then handleChangeFile sets fileUrl, fileName, and billId after successful upload", async () => {
      document.body.innerHTML = NewBillUI();
      const fileUrl = "https://localhost:3456/images/test-uploaded.png";
      const key = "bill123";
      const mockCreate = jest.fn(() => Promise.resolve({ fileUrl, key }));
      const customStore = {
        ...mockStore,
        bills: () => ({
          ...mockStore.bills(),
          create: mockCreate,
        }),
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: customStore,
        localStorage: window.localStorage,
      });
      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy"], "test-uploaded.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(newBill.fileUrl).toBe(fileUrl);
        expect(newBill.fileName).toBe("test-uploaded.png");
        expect(newBill.billId).toBe(key);
      });
      expect(mockCreate).toHaveBeenCalled();
    });

    // Test for handleChangeFile error path (catch block)  >>>> Test line 34 to 53  
    test("Then handleChangeFile logs error if store.bills().create fails", async () => {
      document.body.innerHTML = NewBillUI();
      const error = new Error("upload failed");
      const mockCreate = jest.fn(() => Promise.reject(error));
      const customStore = {
        ...mockStore,
        bills: () => ({
          ...mockStore.bills(),
          create: mockCreate,
        }),
      };
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const newBill = new NewBill({
        document,
        onNavigate,
        store: customStore,
        localStorage: window.localStorage,
      });
      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy"], "test.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      });
      consoleErrorSpy.mockRestore();
    });
    
  });


  // Integration tests for API errors on submit
  describe("When an error occurs on API during bill submission", () => {
    let originalError;
    beforeEach(() => {
      document.body.innerHTML = "";
      originalError = console.error;
      console.error = jest.fn(); // silence error logs
      localStorageMock = {
        getItem: jest.fn(() => JSON.stringify({ email: "employee@test.com" })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      document.body.innerHTML = NewBillUI();
    });
    afterEach(() => {
      console.error = originalError;
    });

    // 404 Error
    test("should display error when API update fails with 404", async () => {
      const errorMsg = "Erreur 404";
      const mockStoreWith404 = {
      ...mockStore,
      bills: () => ({
        ...mockStore.bills(),
        update: () => Promise.reject(new Error(errorMsg)),
      }),
      };
      const onNavigate = jest.fn();
      const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStoreWith404,
      localStorage: window.localStorage,
      });
      // Mock file upload
      newBill.fileUrl = newbill[0].fileUrl;
      newBill.fileName = "test.jpg";
      // Fill required fields using newbill object
      fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: newbill[0].type },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: newbill[0].name },
      });
      fireEvent.change(screen.getByTestId("amount"), {
      target: { value: newbill[0].amount.toString() },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: newbill[0].date },
      });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: newbill[0].vat } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: newbill[0].pct.toString() } });
      fireEvent.change(screen.getByTestId("commentary"), {
      target: { value: newbill[0].commentary },
      });
      // Submit form
      fireEvent.submit(screen.getByTestId("form-new-bill"));
      await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining(new Error(errorMsg))
      );
      });
    });

    // 500 Error
    test("should display error when API update fails with 500", async () => {
      const errorMsg = "Erreur 500";
      const mockStoreWith500 = {
      ...mockStore,
      bills: () => ({
        ...mockStore.bills(),
        update: () => Promise.reject(new Error(errorMsg)),
      }),
      };
      const onNavigate = jest.fn();
      const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStoreWith500,
      localStorage: window.localStorage,
      });
      // Mock file upload
      newBill.fileUrl = newbill[0].fileUrl;
      newBill.fileName = "test.jpg";
      // Fill required fields using newbill object
      fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: newbill[0].type },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: newbill[0].name },
      });
      fireEvent.change(screen.getByTestId("amount"), {
      target: { value: newbill[0].amount.toString() },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: newbill[0].date },
      });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: newbill[0].vat } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: newbill[0].pct.toString() } });
      fireEvent.change(screen.getByTestId("commentary"), {
      target: { value: newbill[0].commentary },
      });
      // Submit form
      fireEvent.submit(screen.getByTestId("form-new-bill"));
      await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining(new Error(errorMsg))
      );
      });
    });
  });
});
