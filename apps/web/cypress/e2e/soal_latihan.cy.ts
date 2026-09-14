describe("Feature Test: Soal Latihan & Kuis Kaizen", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();
    cy.url().should("include", "/dashboard");
  });

  it("Harus menampilkan halaman daftar soal latihan", () => {
    cy.visit("/dashboard/soal");
    cy.contains(/soal|latihan|kuis/i).should("be.visible");
  });
});
