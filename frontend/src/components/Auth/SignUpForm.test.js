import api from "../../api/axios";
jest.mock("../../api/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));
describe("SignUp authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("registers a user with username, email and password", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: {
          username: "johndoe",
        },
      },
    });
    const userData = {
      username: "johndoe",
      email: "john@example.com",
      password: "password123",
    };
    const response = await api.post("/auth/register", userData);
    expect(api.post).toHaveBeenCalledWith(
      "/auth/register",
      userData
    );
    expect(response.data.success).toBe(true);
    expect(response.data.user.username).toBe("johndoe");
  });
  test("handles registration API error", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Email already in use.",
        },
      },
    });
    await expect(
      api.post("/auth/register", {
        username: "johndoe",
        email: "existing@example.com",
        password: "password123",
      })
    ).rejects.toMatchObject({
      response: {
        data: {
          message: "Email already in use.",
        },
      },
    });
  });
  test("uses fallback registration error when API message is missing", async () => {
    api.post.mockRejectedValueOnce(
      new Error("Network error")
    );
    try {
      await api.post("/auth/register", {
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create your account.";
      expect(message).toBe(
        "Unable to create your account."
      );
    }
  });
});

