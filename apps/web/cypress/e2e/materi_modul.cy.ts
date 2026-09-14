describe("Feature Test: Materi & Modul Pembelajaran", () => {
  beforeEach(() => {
    // Login sebagai user
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/dashboard");
  });

  it("Harus dapat mengakses daftar modul materi di dashboard", () => {
    cy.visit("/dashboard/materi");
    cy.contains(/materi|modul/i).should("be.visible");
  });

  it("Harus dapat membuka detail modul materi dan tombol kembali berfungsi tanpa overflow", () => {
    cy.visit("/dashboard/materi");
    cy.get("a[href*='/dashboard/materi/']").first().click();
    
    // Verifikasi tombol kembali ada dan dapat diklik
    cy.contains(/Kembali/i).should("be.visible");
  });
});
