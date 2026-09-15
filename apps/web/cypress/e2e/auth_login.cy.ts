describe("Feature Test: Autentikasi & Login (Multi Role)", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("Harus menampilkan form login dengan elemen yang lengkap", () => {
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").should("be.visible");
    cy.get("button[type='submit']").should("be.visible");
  });

  it("Harus menolak login dengan password salah", () => {
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("passwordsalah123");
    cy.get("button[type='submit']").click();

    cy.contains(/salah|gagal|invalid/i).should("be.visible");
  });

  it("Harus berhasil login dengan kredensial Admin yang baru", () => {
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();

    // Verifikasi redirect ke dashboard
    cy.url().should("include", "/dashboard");
    cy.contains(/dashboard|administrator/i).should("be.visible");
  });
});
