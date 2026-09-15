describe("Feature Test: Profil & Kelola Pengguna (Admin)", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/dashboard");
  });

  it("Harus dapat mengakses halaman Edit Profil", () => {
    cy.visit("/dashboard/profile");
    cy.contains(/Profil|Pengaturan/i).should("be.visible");
  });

  it("Harus dapat mengakses halaman Kelola Pengguna (Khusus Admin)", () => {
    cy.visit("/dashboard/admin/users");
    cy.contains(/Kelola Pengguna|User Management/i).should("be.visible");
  });
});
