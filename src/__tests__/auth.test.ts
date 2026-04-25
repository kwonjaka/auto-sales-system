describe("인증 API", () => {
  it("should return 200 with token on valid login", async () => {
    const res = await fetch("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hong@test.com", password: "password123" }),
    });
    const json = await res.json();

    expect(res.ok).toBe(true);
    expect(json.data.accessToken).toBeDefined();
    expect(json.data.salesperson.email).toBe("hong@test.com");
  });
});
