/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login, { PREVIOUS_LOCATION } from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

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
    test("Then I should be identified as an Employee in app and navigated to Bills", (done) => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "employee@test.tld",
        password: "employee",
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
      // Wait for async operations to complete
      setTimeout(() => {
        // navigation + previous location + body color
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
        expect(document.body.style.backgroundColor).toBe("rgb(255, 255, 255)");
        done();
      }, 100);
    });

    test("Employee catch branch: login rejects then createUser called then navigates", (done) => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "employee@test.tld",
        password: "employee",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: inputData.password } });

      const form = screen.getByTestId("form-employee");
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = {
        login: jest.fn(() => Promise.reject("error")),
        users: () => ({
          create: jest.fn(() => Promise.resolve()),
        }),
      };
      const loginInstance = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });
      // Mock createUser to resolve immediately
      loginInstance.createUser = jest.fn(() => Promise.resolve());
      fireEvent.submit(form);
      setTimeout(() => {
        expect(store.login).toHaveBeenCalled();
        expect(loginInstance.createUser).toHaveBeenCalled();
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
        expect(document.body.style.backgroundColor).toBe("rgb(255, 255, 255)");
        done();
      }, 100);
    });
  });
});

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
    test("Then I should be identified as an HR admin in app and navigated to Dashboard", (done) => {
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
      setTimeout(() => {
        expect(screen.getByText("Validations")).toBeTruthy();
        expect(document.body.style.backgroundColor).toBe("rgb(255, 255, 255)");
        done();
      }, 100);
    });

    test("Admin catch branch: login rejects then createUser called then navigates", (done) => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "admin@test.tld",
        password: "admin",
      };

      const inputEmailUser = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: inputData.password } });

      const form = screen.getByTestId("form-admin");
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = {
        login: jest.fn(() => Promise.reject("error")),
        users: () => ({
          create: jest.fn(() => Promise.resolve()),
        }),
      };
      const loginInstance = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });
      // Mock createUser to resolve immediately
      loginInstance.createUser = jest.fn(() => Promise.resolve());
      fireEvent.submit(form);
      setTimeout(() => {
        expect(store.login).toHaveBeenCalled();
        expect(loginInstance.createUser).toHaveBeenCalled();
        expect(screen.getByText("Validations")).toBeTruthy();
        expect(document.body.style.backgroundColor).toBe("rgb(255, 255, 255)");
        done();
      }, 100);
    });
  });
});

describe("Login class low-level methods", () => {
  test("login with store sets jwt", async () => {
    document.body.innerHTML = LoginUI();
    const mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    const store = {
      login: jest.fn(() => Promise.resolve({ jwt: "token123" })),
    };
    const onNavigate = jest.fn();
    const loginInstance = new Login({ document, localStorage: mockLocalStorage, onNavigate, PREVIOUS_LOCATION: "", store });
    const user = { email: "user@test.com", password: "pwd" };
    await loginInstance.login(user);
    expect(store.login).toHaveBeenCalled();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("jwt", "token123");
  });
  test("login without store returns null", () => {
    document.body.innerHTML = LoginUI();
    const loginInstance = new Login({ document, localStorage: window.localStorage, onNavigate: jest.fn(), PREVIOUS_LOCATION: "", store: null });
    const result = loginInstance.login({ email: "x", password: "y" });
    expect(result).toBeNull();
  });
  test("createUser with store calls users().create then login", async () => {
    document.body.innerHTML = LoginUI();
    const loginMock = jest.fn(() => Promise.resolve({ jwt: "abc" }));
    const usersCreateMock = jest.fn(() => Promise.resolve());
    const store = {
      login: loginMock,
      users: () => ({ create: usersCreateMock }),
    };
    const loginInstance = new Login({ document, localStorage: window.localStorage, onNavigate: jest.fn(), PREVIOUS_LOCATION: "", store });
    const user = { type: "Employee", email: "john@test.com", password: "pwd" };
    await loginInstance.createUser(user);
    expect(usersCreateMock).toHaveBeenCalled();
    expect(loginMock).toHaveBeenCalled();
  });
  test("createUser without store returns null", () => {
    document.body.innerHTML = LoginUI();
    const loginInstance = new Login({ document, localStorage: window.localStorage, onNavigate: jest.fn(), PREVIOUS_LOCATION: "", store: null });
    const result = loginInstance.createUser({ email: "x", password: "y" });
    expect(result).toBeNull();
  });
});
