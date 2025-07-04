/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"

jest.mock("../app/store", () => mockStore)

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in incorrect format and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
      expect(inputEmailUser.value).toBe("pasunemail");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
      expect(inputPasswordUser.value).toBe("azerty");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in correct format and I click on employee button Login In", () => {
    test("Then I should be identified as an Employee in app", () => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "johndoe@email.com",
        password: "azerty",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-employee");

      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";

      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Employee",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );
    });

    test("It should renders Bills page", () => {
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });   
    
    // @TODO Catch error handling for login
  });
});

// // Test for login error handling > line 40 & 62
// describe("Try login and catch login error handling", () => {

//   // As an employee should call createUser if login fails and then navigate to Bills // Line 40
//   test("As an employee should call createUser if login fails and then navigate to Bills", async () => {
//     document.body.innerHTML = LoginUI();

//     // Mock localStorage
//     Object.defineProperty(window, 'localStorage', { value: localStorageMock })

//     // Mock navigation
//     const onNavigate = jest.fn((pathname) => {
//       document.body.innerHTML = ROUTES({ pathname });
//     });

//     let PREVIOUS_LOCATION = "";

//     // Mock login to reject (simulate error), and createUser to resolve
//     const user = {
//       type: "Employee",
//       email: "test@email.com",
//       password: "password",
//       status: "connected",
//     };

//     // Mock store
//     const createUser = jest.fn(() => Promise.resolve({}));
//     const store = {...mockStore, login: jest.fn(() => {
//         // return Promise.reject(new Error("login error"));
//         throw new Error("login error");
//       }), users: () => ({
//         create: createUser,
//       }) };

//     // Create Login instance
//     const login = new Login({
//       document,
//       localStorage: window.localStorage,
//       onNavigate,
//       PREVIOUS_LOCATION,
//       store: store,
//     });

//     // Fill in employee login form
//     const inputEmailUser = screen.getByTestId("employee-email-input");
//     const inputPasswordUser = screen.getByTestId("employee-password-input");
//     fireEvent.change(inputEmailUser, { target: { value: "test@email.com" } });
//     fireEvent.change(inputPasswordUser, { target: { value: "password" } });

//     const form = screen.getByTestId("form-employee");
//     const handleSubmit = jest.fn(login.handleSubmitEmployee);

//     form.addEventListener("submit", handleSubmit);
//     fireEvent.submit(form);
    

//     expect(handleSubmit).toHaveBeenCalled();
//     expect(store.login).toHaveBeenCalled();
//     expect(store.login).toHaveBeenCalledWith(JSON.stringify({email: user.email, password: user.password}));
//     expect(createUser).toHaveBeenCalledWith(user);

//   });

//   // As admin should call createUser if login fails and then navigate to Bills // Line 62
//   test("As an admin should call createUser if login fails and then navigate to Bills", async () => {
//     document.body.innerHTML = LoginUI();

//     // Fill in employee login form
//     const inputEmailUser = screen.getByTestId("admin-email-input");
//     const inputPasswordUser = screen.getByTestId("admin-password-input");
//     fireEvent.change(inputEmailUser, { target: { value: "test@email.com" } });
//     fireEvent.change(inputPasswordUser, { target: { value: "password" } });

//     // Mock localStorage
//     Object.defineProperty(window, "localStorage", {
//       value: {
//         getItem: jest.fn(() => null),
//         setItem: jest.fn(() => null),
//       },
//       writable: true,
//     });

//     // Mock navigation
//     const onNavigate = jest.fn((pathname) => {
//       document.body.innerHTML = ROUTES({ pathname });
//     });

//     let PREVIOUS_LOCATION = "";

//     // Mock store
//     const store = jest.fn();

//     // Create Login instance
//     const login = new Login({
//       document,
//       localStorage: window.localStorage,
//       onNavigate,
//       PREVIOUS_LOCATION,
//       store,
//     });

//     // Mock login to reject (simulate error), and createUser to resolve
//     const user = {
//       type: "Admin",
//       email: "badtest@email.com",
//       password: "password",
//       status: "connected",
//     };
//     login.login = jest.fn().mockRejectedValue(new Error("login error"));
//     login.createUser = jest.fn().mockResolvedValue({});

//     const form = screen.getByTestId("form-admin");
//     const handleSubmit = jest.fn(login.handleSubmitAdmin);
//     login.login = jest.fn().mockResolvedValue({});
//     form.addEventListener("submit", handleSubmit);
//     fireEvent.submit(form);

//     expect(handleSubmit).toHaveBeenCalled();
//     expect(window.localStorage.setItem).toHaveBeenCalled();
//     expect(login.login).toHaveBeenCalledWith(user);
//     expect(login.createUser).toHaveBeenCalledWith(user);
//   });

// });

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on admin button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("admin-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-admin");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });
  });

  describe("When I do fill fields in incorrect format and I click on admin button Login In", () => {
    test("Then it should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
      expect(inputEmailUser.value).toBe("pasunemail");

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
      expect(inputPasswordUser.value).toBe("azerty");

      const form = screen.getByTestId("form-admin");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });
  });

  describe("When I do fill fields in correct format and I click on admin button Login In", () => {
    test("Then I should be identified as an HR admin in app", () => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        type: "Admin",
        email: "johndoe@email.com",
        password: "azerty",
        status: "connected",
      };

      const inputEmailUser = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-admin");

      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";

      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitAdmin);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Admin",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );
    });

    test("It should renders HR dashboard page", () => {
      expect(screen.queryByText("Validations")).toBeTruthy();
    });
  });
});