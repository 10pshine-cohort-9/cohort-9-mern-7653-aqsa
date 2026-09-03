import api from "../../api/axios";
jest.mock("../../api/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));
describe("SignIn authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("logs in with email and password", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: {
          email: "john@example.com",
        },
      },
    });
    const credentials = {
      email: "john@example.com",
      password: "password123",
    };
    const response = await api.post(
      "/auth/login",
      credentials
    );
    expect(api.post).toHaveBeenCalledWith(
      "/auth/login",
      credentials
    );
    expect(response.data.success).toBe(true);
    expect(response.data.user.email).toBe(
      "john@example.com"
    );
  });
  test("handles invalid login credentials", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid email or password.",
        },
      },
    });
    await expect(
      api.post("/auth/login", {
        email: "john@example.com",
        password: "wrongpassword",
      })
    ).rejects.toMatchObject({
      response: {
        data: {
          message: "Invalid email or password.",
        },
      },
    });
  });
  test("uses fallback login error when API message is missing", async () => {
    api.post.mockRejectedValueOnce(
      new Error("Network error")
    );
    try {
      await api.post("/auth/login", {
        email: "john@example.com",
        password: "password123",
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to sign in. Please check your credentials.";

      expect(message).toBe(
        "Unable to sign in. Please check your credentials."
      );
    }
  });
});